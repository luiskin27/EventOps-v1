from rest_framework import serializers

from .models import Participant, Role


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = "__all__"


class ParticipantSerializer(serializers.ModelSerializer):
    """Полный вид, только для организаторов."""

    role_name = serializers.CharField(source="role.name", read_only=True, default=None)
    badge_token = serializers.SerializerMethodField()

    def get_badge_token(self, obj):
        badge = getattr(obj, "badge", None)
        return str(badge.verification_token) if badge else None

    class Meta:
        model = Participant
        fields = "__all__"


class GuestParticipantSerializer(serializers.ModelSerializer):
    """Гость видит только безопасные поля. Без guest_code, заметок и user."""

    class Meta:
        model = Participant
        fields = ["id", "full_name", "event", "role"]
        read_only_fields = fields
