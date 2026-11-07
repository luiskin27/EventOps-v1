from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from apps.participants.access import (
    GuestScopedQuerysetMixin,
    StaffOrGuestCreate,
    StaffOrReadOnlyGuest,
    get_participant,
)

from .models import Payment, PaymentItem
from .serializers import GuestPaymentSerializer, PaymentItemSerializer, PaymentSerializer


class PaymentItemViewSet(GuestScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = PaymentItem.objects.all()
    serializer_class = PaymentItemSerializer
    filterset_fields = ["event"]
    permission_classes = [StaffOrReadOnlyGuest]


class PaymentViewSet(viewsets.ModelViewSet):
    """Staff: все платежи, подтверждение/отклонение.
    Гость: видит свои платежи и может отправить новый (чек) — статус всегда PENDING."""

    queryset = Payment.objects.select_related("participant", "item")
    filterset_fields = ["status", "participant", "item__event"]
    permission_classes = [StaffOrGuestCreate]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.request.user.is_staff:
            return PaymentSerializer
        return GuestPaymentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_staff:
            return qs
        me = get_participant(self.request.user)
        return qs.filter(participant=me) if me else qs.none()

    def perform_create(self, serializer):
        if self.request.user.is_staff:
            serializer.save()
        else:
            serializer.save(
                participant=get_participant(self.request.user),
                status=Payment.Status.PENDING,
            )
