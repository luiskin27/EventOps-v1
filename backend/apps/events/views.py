from rest_framework import viewsets

from .models import Event
from .serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    filterset_fields = ["event_type", "is_active"]
