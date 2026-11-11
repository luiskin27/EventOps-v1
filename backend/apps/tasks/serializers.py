from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    assignee_username = serializers.CharField(
        source="assignee.username", read_only=True, default=None
    )

    class Meta:
        model = Task
        fields = "__all__"
