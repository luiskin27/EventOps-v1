from rest_framework import serializers

from apps.participants.access import get_participant

from .models import Payment, PaymentItem


class PaymentItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentItem
        fields = "__all__"


class PaymentSerializer(serializers.ModelSerializer):
    participant_name = serializers.CharField(source="participant.full_name", read_only=True)
    item_title = serializers.CharField(source="item.title", read_only=True)
    amount = serializers.DecimalField(
        source="item.amount", max_digits=10, decimal_places=2, read_only=True
    )
    currency = serializers.CharField(source="item.currency", read_only=True)

    class Meta:
        model = Payment
        fields = "__all__"


class GuestPaymentSerializer(PaymentSerializer):
    """Гость не может менять статус, комментарий и участника."""

    class Meta(PaymentSerializer.Meta):
        read_only_fields = ["participant", "status", "admin_comment"]

    def validate_item(self, item):
        me = get_participant(self.context["request"].user)
        if me is None or item.event_id != me.event_id:
            raise serializers.ValidationError("Эта статья оплаты не относится к вашему событию.")
        return item
