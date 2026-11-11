from rest_framework import serializers

from .models import ScheduleItem, ScheduleLink


class ScheduleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleItem
        fields = "__all__"
        read_only_fields = ["is_public"]


class ScheduleLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleLink
        fields = ["id", "event", "audience", "token", "created_at"]
        read_only_fields = ["token", "created_at"]
