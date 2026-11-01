from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "event_type",
            "description",
            "location",
            "start_date",
            "end_date",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
