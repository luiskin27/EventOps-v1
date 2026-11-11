from rest_framework import viewsets

from apps.participants.access import GuestScopedQuerysetMixin, StaffOrReadOnlyGuest

from .models import Event, TeamMember
from .serializers import EventSerializer, TeamMemberSerializer


class EventViewSet(GuestScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    filterset_fields = ["event_type", "is_active"]
    permission_classes = [StaffOrReadOnlyGuest]
    guest_event_lookup = "pk"


class TeamMemberViewSet(viewsets.ModelViewSet):
    """Только организатор (права по умолчанию — IsStaff)."""

    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    filterset_fields = ["event"]
