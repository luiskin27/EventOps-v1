from rest_framework import serializers

from .models import WallPost, WallSettings

MAX_PHOTO = 12 * 1024 * 1024


class WallSettingsSerializer(serializers.ModelSerializer):
    clear_background = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = WallSettings
        fields = [
            "id", "event", "is_enabled", "moderation", "title", "display_mode",
            "background", "clear_background", "post_token", "screen_token",
        ]
        read_only_fields = ["post_token", "screen_token"]

    def validate_background(self, f):
        if f and f.size > MAX_PHOTO:
            raise serializers.ValidationError("Фото больше 12 МБ. Выберите другое.")
        return f

    def update(self, instance, validated_data):
        if validated_data.pop("clear_background", False):
            instance.background.delete(save=False)
            instance.background = ""
        return super().update(instance, validated_data)


class WallPostSerializer(serializers.ModelSerializer):
    """Для организатора: модерация (status) и удаление."""

    class Meta:
        model = WallPost
        fields = ["id", "event", "author_name", "relation", "message", "photo", "status", "created_at"]
        read_only_fields = ["event", "author_name", "relation", "message", "photo", "created_at"]


class PublicWallPostSerializer(serializers.ModelSerializer):
    """Гость без входа: имя, кем приходится, текст и/или фото."""

    class Meta:
        model = WallPost
        fields = ["id", "author_name", "relation", "message", "photo", "status", "created_at"]
        read_only_fields = ["status", "created_at"]

    def validate_author_name(self, v):
        v = v.strip()
        if not v:
            raise serializers.ValidationError("Напишите, как вас зовут.")
        return v

    def validate_photo(self, f):
        if f and f.size > MAX_PHOTO:
            raise serializers.ValidationError("Фото больше 12 МБ. Выберите другое или сделайте скриншот.")
        return f

    def validate(self, attrs):
        if not (attrs.get("message") or "").strip() and not attrs.get("photo"):
            raise serializers.ValidationError({"message": "Напишите пожелание или прикрепите фото."})
        return attrs


class ScreenPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = WallPost
        fields = ["id", "author_name", "relation", "message", "photo", "created_at"]
