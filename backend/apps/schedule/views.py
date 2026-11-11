from rest_framework import viewsets

from apps.participants.access import GuestScopedQuerysetMixin, StaffOrReadOnlyGuest

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ScheduleItem, ScheduleLink
from .serializers import ScheduleItemSerializer, ScheduleLinkSerializer


class ScheduleItemViewSet(GuestScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = ScheduleItem.objects.all()
    serializer_class = ScheduleItemSerializer
    filterset_fields = ["event", "is_public", "audience"]
    permission_classes = [StaffOrReadOnlyGuest]
    guest_public_lookup = "is_public"


class ScheduleLinkViewSet(viewsets.ModelViewSet):
    """Организатор создаёт/пересоздаёт ссылки (удалить = старая ссылка перестанет работать)."""

    queryset = ScheduleLink.objects.all()
    serializer_class = ScheduleLinkSerializer
    filterset_fields = ["event", "audience"]
    http_method_names = ["get", "post", "delete"]

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        link, _ = ScheduleLink.objects.get_or_create(
            event=ser.validated_data["event"], audience=ser.validated_data["audience"]
        )
        return Response(self.get_serializer(link).data, status=201)


class PublicScheduleView(APIView):
    """GET /api/public/schedule/<token>/ — расписание по ссылке, без входа."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        try:
            link = ScheduleLink.objects.select_related("event").get(token=token)
        except ScheduleLink.DoesNotExist:
            return Response({"detail": "Ссылка не найдена или отключена организатором."}, status=404)
        items = ScheduleItem.objects.filter(event=link.event, audience__in=link.visible_audiences())
        return Response({
            "event": link.event.title,
            "location": link.event.location,
            "audience": link.audience,
            "audience_label": link.get_audience_display(),
            "items": ScheduleItemSerializer(items, many=True).data,
        })
