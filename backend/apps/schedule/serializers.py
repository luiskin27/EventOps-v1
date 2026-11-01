from rest_framework import serializers

from .models import ScheduleItem


class ScheduleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleItem
        fields = "__all__"
