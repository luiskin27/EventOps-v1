from rest_framework import serializers

from .models import Participant, Role


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = "__all__"


class ParticipantSerializer(serializers.ModelSerializer):
    """Полный вид, только для организаторов."""

    class Meta:
        model = Participant
        fields = "__all__"


class GuestParticipantSerializer(serializers.ModelSerializer):
    """Гость видит только безопасные поля. Без guest_code, заметок и user."""

    class Meta:
        model = Participant
        fields = ["id", "full_name", "event", "role"]
        read_only_fields = fields
