from django.db import models

from apps.events.models import Event
from apps.participants.models import Participant


class PaymentItem(models.Model):
    """Фиксированная статья оплаты для события: взнос, проживание, питание."""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="payment_items")
    title = models.CharField("Название", max_length=200)
    amount = models.DecimalField("Сумма", max_digits=10, decimal_places=2)
    currency = models.CharField("Валюта", max_length=10, default="KGS")

    class Meta:
        verbose_name = "Статья оплаты"
        verbose_name_plural = "Статьи оплаты"

    def __str__(self):
        return f"{self.title} — {self.amount} {self.currency}"


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "На проверке"
        APPROVED = "APPROVED", "Подтверждён"
        REJECTED = "REJECTED", "Отклонён"

    participant = models.ForeignKey(
        Participant, on_delete=models.CASCADE, related_name="payments"
    )
    item = models.ForeignKey(PaymentItem, on_delete=models.PROTECT, related_name="payments")
    receipt = models.FileField("Чек", upload_to="receipts/", blank=True)
    status = models.CharField(
        "Статус", max_length=20, choices=Status.choices, default=Status.PENDING
    )
    admin_comment = models.TextField("Комментарий администратора", blank=True)
    created_at = models.DateTimeField("Создан", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлён", auto_now=True)

    class Meta:
        verbose_name = "Платёж"
        verbose_name_plural = "Платежи"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.participant.full_name}: {self.item.title} [{self.status}]"
