import io

import qrcode
from django.conf import settings
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .models import WallPost, WallSettings
from .serializers import (
    PublicWallPostSerializer,
    ScreenPostSerializer,
    WallPostSerializer,
    WallSettingsSerializer,
)


# ---------- организатор (права по умолчанию — IsStaff) ----------

class WallSettingsViewSet(viewsets.ModelViewSet):
    queryset = WallSettings.objects.select_related("event")
    serializer_class = WallSettingsSerializer
    filterset_fields = ["event"]
    http_method_names = ["get", "post", "patch"]

    def create(self, request, *args, **kwargs):
        # Одна стена на мероприятие: повторный POST вернёт существующую
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj, _ = WallSettings.objects.get_or_create(event=ser.validated_data["event"])
        return Response(self.get_serializer(obj).data, status=status.HTTP_201_CREATED)


class WallPostViewSet(viewsets.ModelViewSet):
    queryset = WallPost.objects.all()
    serializer_class = WallPostSerializer
    filterset_fields = ["event", "status"]
    http_method_names = ["get", "patch", "delete"]


# ---------- публично, без входа ----------

def _settings_or_404(**lookup):
    try:
        return WallSettings.objects.select_related("event").get(**lookup)
    except WallSettings.DoesNotExist:
        return None


class WallThrottle(AnonRateThrottle):
    scope = "wall"


class PublicWallView(APIView):
    """GET — что показать гостю на странице по QR; POST — отправить поздравление."""

    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_throttles(self):
        return [WallThrottle()] if self.request.method == "POST" else []

    def get(self, request, token):
        w = _settings_or_404(post_token=token)
        if not w:
            return Response({"detail": "Ссылка не найдена."}, status=404)
        return Response({
            "event": w.event.title,
            "title": w.display_title,
            "is_enabled": w.is_enabled,
            "moderation": w.moderation,
        })

    def post(self, request, token):
        w = _settings_or_404(post_token=token)
        if not w:
            return Response({"detail": "Ссылка не найдена."}, status=404)
        if not w.is_enabled:
            return Response({"detail": "Приём поздравлений уже закрыт. Спасибо!"}, status=403)
        ser = PublicWallPostSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        post_status = WallPost.Status.APPROVED if w.moderation == WallSettings.Moderation.AFTER else WallPost.Status.PENDING
        post = ser.save(event=w.event, status=post_status)
        return Response(PublicWallPostSerializer(post, context={"request": request}).data, status=201)


class PublicScreenView(APIView):
    """Страница для проектора: одобренные поздравления, новые сверху."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        w = _settings_or_404(screen_token=token)
        if not w:
            return Response({"detail": "Ссылка не найдена."}, status=404)
        posts = WallPost.objects.filter(event=w.event, status=WallPost.Status.APPROVED)[:200]
        return Response({
            "title": w.display_title,
            "event": w.event.title,
            "post_url": f"{settings.PUBLIC_BASE_URL}/w/{w.post_token}",
            "post_token": str(w.post_token),
            "posts": ScreenPostSerializer(posts, many=True, context={"request": request}).data,
        })


class WallQRView(APIView):
    """PNG с QR-кодом для столов: ведёт на страницу «оставить поздравление»."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        if not WallSettings.objects.filter(post_token=token).exists():
            return Response({"detail": "Ссылка не найдена."}, status=404)
        img = qrcode.make(f"{settings.PUBLIC_BASE_URL}/w/{token}", box_size=12, border=2)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return HttpResponse(buf.getvalue(), content_type="image/png")
