from rest_framework import serializers

from .models import Payment, PaymentItem


class PaymentItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentItem
        fields = "__all__"


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"
