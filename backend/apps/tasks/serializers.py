from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    assignee_username = serializers.CharField(
        source="assignee.username", read_only=True, default=None
    )
    responsible_name = serializers.CharField(source="responsible.full_name", read_only=True, default=None)
    responsible_position = serializers.CharField(source="responsible.position", read_only=True, default=None)

    def validate(self, attrs):
        event = attrs.get("event") or getattr(self.instance, "event", None)
        responsible = attrs.get("responsible")
        if responsible and event and responsible.event_id != event.id:
            raise serializers.ValidationError({"responsible": "Этот человек из команды другого мероприятия."})
        return attrs

    class Meta:
        model = Task
        fields = "__all__"
