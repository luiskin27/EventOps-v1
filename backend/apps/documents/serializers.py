import os

from django.urls import reverse
from rest_framework import serializers

from apps.participants.access import get_participant

from .models import Document, DocumentType, ParticipantDocument

MAX_SIZE = 10 * 1024 * 1024
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".pdf"}


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = "__all__"


class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = "__all__"


class ParticipantDocumentSerializer(serializers.ModelSerializer):
    """Для организатора. Файл отдаётся только через защищённый адрес file_url."""

    participant_name = serializers.CharField(source="participant.full_name", read_only=True)
    participant_email = serializers.CharField(source="participant.email", read_only=True)
    participant_role = serializers.CharField(source="participant.role.name", read_only=True, default=None)
    type_title = serializers.CharField(source="doc_type.title", read_only=True)
    event = serializers.IntegerField(source="doc_type.event_id", read_only=True)
    file_url = serializers.SerializerMethodField()
    is_image = serializers.SerializerMethodField()
    file = serializers.FileField(write_only=True)

    class Meta:
        model = ParticipantDocument
        exclude = ["reviewed_by"]
        read_only_fields = ["original_name", "size", "created_at", "updated_at"]

    def get_file_url(self, obj):
        return reverse("participant-document-file", args=[obj.pk])

    def get_is_image(self, obj):
        return os.path.splitext(obj.file.name)[1].lower() in {".jpg", ".jpeg", ".png", ".webp"}

    def validate_file(self, f):
        ext = os.path.splitext(f.name)[1].lower()
        if ext not in ALLOWED_EXT:
            raise serializers.ValidationError("Подойдут фото (JPG, PNG, HEIC) или PDF.")
        if f.size > MAX_SIZE:
            raise serializers.ValidationError("Файл больше 10 МБ. Сожмите фото или сделайте скриншот.")
        return f

    def validate(self, attrs):
        if attrs.get("status") == ParticipantDocument.Status.REJECTED and not (
            attrs.get("admin_comment") or getattr(self.instance, "admin_comment", "")
        ).strip():
            raise serializers.ValidationError(
                {"admin_comment": "Напишите, что не так — участник увидит это в кабинете."}
            )
        return attrs

    def create(self, validated_data):
        f = validated_data["file"]
        validated_data["original_name"] = f.name[:255]
        validated_data["size"] = f.size
        return super().create(validated_data)


class GuestParticipantDocumentSerializer(ParticipantDocumentSerializer):
    """Участник загружает файл; статус и комментарий менять не может."""

    class Meta(ParticipantDocumentSerializer.Meta):
        read_only_fields = [
            "participant", "status", "admin_comment", "original_name", "size", "created_at", "updated_at",
        ]

    def validate_doc_type(self, doc_type):
        me = get_participant(self.context["request"].user)
        if me is None or doc_type.event_id != me.event_id:
            raise serializers.ValidationError("Этот документ не относится к вашему мероприятию.")
        return doc_type
