import csv
from collections import defaultdict
from decimal import Decimal

from django.http import HttpResponse
from rest_framework.views import APIView

from apps.events.models import Event
from apps.payments.models import Payment, PaymentItem

from .access import IsStaff
from .models import Participant


def _safe(value):
    """Защита от формул в Excel: значения, начинающиеся с = + - @, экранируем."""
    text = "" if value is None else str(value)
    if text[:1] in ("=", "+", "-", "@"):
        return "'" + text
    return text


def _money(by_currency):
    """{'KGS': Decimal('5000')} -> '5000 KGS' (несколько валют через ' + ')."""
    parts = [f"{amount:.2f} {cur}" for cur, amount in sorted(by_currency.items()) if amount]
    return " + ".join(parts) if parts else "0"


class ParticipantsCSVExportView(APIView):
    """Выгрузка списка участников события в CSV. Только для персонала."""

    permission_classes = [IsStaff]

    def get(self, request, event_id):
        event = Event.objects.filter(pk=event_id).first()
        if event is None:
            return HttpResponse("Событие не найдено", status=404)

        items = list(PaymentItem.objects.filter(event=event))
        total_due = defaultdict(Decimal)
        for item in items:
            total_due[item.currency] += item.amount

        # Статус платежей по участникам: {participant_id: {item_id: статус}}
        statuses = defaultdict(dict)
        payments = Payment.objects.filter(item__event=event).select_related("item")
        for pay in payments:
            current = statuses[pay.participant_id].get(pay.item_id)
            # Если по статье несколько платежей, лучший статус важнее:
            # APPROVED > PENDING > REJECTED
            rank = {"APPROVED": 3, "PENDING": 2, "REJECTED": 1}
            if current is None or rank[pay.status] > rank[current]:
                statuses[pay.participant_id][pay.item_id] = pay.status

        item_by_id = {item.pk: item for item in items}

        participants = (
            Participant.objects.filter(event=event)
            .select_related("role")
            .order_by("full_name")
        )

        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = (
            f'attachment; filename="participants_event_{event.pk}.csv"'
        )
        # BOM, чтобы Excel правильно распознал русские буквы
        response.write("\ufeff")

        writer = csv.writer(response, delimiter=";")
        writer.writerow([
            "ФИО", "Телефон", "Email", "Роль", "Код гостя", "Заметки",
            "К оплате", "Оплачено", "На проверке", "Долг", "Статус оплаты",
        ])
        for p in participants:
            paid = defaultdict(Decimal)
            pending = defaultdict(Decimal)
            for item_id, status in statuses.get(p.pk, {}).items():
                item = item_by_id[item_id]
                if status == "APPROVED":
                    paid[item.currency] += item.amount
                elif status == "PENDING":
                    pending[item.currency] += item.amount

            debt = defaultdict(Decimal)
            for cur, due in total_due.items():
                debt[cur] = due - paid[cur]

            if not items:
                state = "Нет статей оплаты"
            elif all(v <= 0 for v in debt.values()):
                state = "Оплачено"
            elif any(pending.values()):
                state = "Есть платежи на проверке"
            elif any(paid.values()):
                state = "Оплачено частично"
            else:
                state = "Не оплачено"

            writer.writerow([
                _safe(p.full_name),
                _safe(p.phone),
                _safe(p.email),
                _safe(p.role.name if p.role_id else ""),
                _safe(p.guest_code),
                _safe(p.notes),
                _money(total_due),
                _money(paid),
                _money(pending),
                _money({c: v for c, v in debt.items() if v > 0}),
                state,
            ])
        return response
