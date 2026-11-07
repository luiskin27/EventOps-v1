from rest_framework import viewsets

from .access import StaffOrReadOnlyGuest, get_participant
from .models import Participant, Role
from .serializers import (
    GuestParticipantSerializer,
    ParticipantSerializer,
    RoleSerializer,
)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    filterset_fields = ["event"]
    permission_classes = [StaffOrReadOnlyGuest]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_staff:
            return qs
        me = get_participant(self.request.user)
        return qs.filter(event=me.event) if me else qs.none()


class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.select_related("role", "badge")
    filterset_fields = ["event"]
    permission_classes = [StaffOrReadOnlyGuest]

    def get_serializer_class(self):
        if self.request.user.is_staff:
            return ParticipantSerializer
        return GuestParticipantSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_staff:
            return qs
        me = get_participant(self.request.user)
        return qs.filter(pk=me.pk) if me else qs.none()
