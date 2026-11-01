from rest_framework import viewsets

from .models import ScheduleItem
from .serializers import ScheduleItemSerializer


class ScheduleItemViewSet(viewsets.ModelViewSet):
    queryset = ScheduleItem.objects.all()
    serializer_class = ScheduleItemSerializer
    filterset_fields = ["event", "is_public"]
