from rest_framework import viewsets

from .models import Payment, PaymentItem
from .serializers import PaymentItemSerializer, PaymentSerializer


class PaymentItemViewSet(viewsets.ModelViewSet):
    queryset = PaymentItem.objects.all()
    serializer_class = PaymentItemSerializer
    filterset_fields = ["event"]


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    filterset_fields = ["status"]
