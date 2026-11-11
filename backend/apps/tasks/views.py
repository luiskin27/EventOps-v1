from rest_framework import viewsets

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related("assignee", "responsible")
    serializer_class = TaskSerializer
    filterset_fields = ["event", "status", "assignee", "responsible"]
