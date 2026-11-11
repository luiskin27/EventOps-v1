from rest_framework import viewsets

from apps.participants.access import GuestScopedQuerysetMixin, StaffOrReadOnlyGuest

from .models import ScheduleItem
from .serializers import ScheduleItemSerializer


class ScheduleItemViewSet(GuestScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = ScheduleItem.objects.all()
    serializer_class = ScheduleItemSerializer
    filterset_fields = ["event", "is_public"]
    permission_classes = [StaffOrReadOnlyGuest]
    guest_public_lookup = "is_public"
