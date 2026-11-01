from rest_framework import serializers

from .models import Badge, BadgeTemplate


class BadgeTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BadgeTemplate
        fields = "__all__"


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = "__all__"
        read_only_fields = ["verification_token", "issued_at"]
