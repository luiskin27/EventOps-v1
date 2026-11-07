from rest_framework import viewsets

from apps.participants.access import GuestScopedQuerysetMixin, StaffOrReadOnlyGuest

from .models import Event
from .serializers import EventSerializer


class EventViewSet(GuestScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    filterset_fields = ["event_type", "is_active"]
    permission_classes = [StaffOrReadOnlyGuest]
    guest_event_lookup = "pk"
