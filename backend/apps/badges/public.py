import io

import qrcode
from django.conf import settings
from django.http import HttpResponse
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.participants.access import get_participant

from .models import Badge, BadgeTemplate


def documents_status(participant):
    """ok / pending / missing / none — по обязательным типам документов события."""
    from apps.documents.models import DocumentType, ParticipantDocument

    required = set(
        DocumentType.objects.filter(event_id=participant.event_id, is_required=True).values_list("pk", flat=True)
    )
    if not required:
        return "none"
    docs = ParticipantDocument.objects.filter(participant=participant, doc_type_id__in=required)
    approved = set(docs.filter(status=ParticipantDocument.Status.APPROVED).values_list("doc_type_id", flat=True))
    if approved >= required:
        return "ok"
    if docs.filter(status=ParticipantDocument.Status.PENDING).exists():
        return "pending"
    return "missing"


def admission(badge, participant):
    payment = payment_status(participant)
    documents = documents_status(participant)
    admitted = badge.is_active and payment in ("paid", "none") and documents in ("ok", "none")
    return payment, documents, admitted


def payment_status(participant):
    """paid / pending / unpaid / none — по всем статьям оплаты события."""
    from apps.payments.models import Payment, PaymentItem

    item_ids = set(PaymentItem.objects.filter(event_id=participant.event_id).values_list("pk", flat=True))
    if not item_ids:
        return "none"
    payments = Payment.objects.filter(participant=participant, item_id__in=item_ids)
    approved = set(payments.filter(status=Payment.Status.APPROVED).values_list("item_id", flat=True))
    if approved >= item_ids:
        return "paid"
    if payments.filter(status=Payment.Status.PENDING).exists():
        return "pending"
    return "unpaid"



class PublicBadgeVerifyView(APIView):
    """Публичная проверка бейджа по токену из QR-кода. Вход не нужен."""

    permission_classes = [AllowAny]
    authentication_classes = []  # токен не нужен, посторонние заголовки игнорируем

    def get(self, request, token):
        try:
            badge = Badge.objects.select_related(
                "participant", "participant__role", "participant__event"
            ).get(verification_token=token)
        except (Badge.DoesNotExist, ValueError):
            # Одинаковый ответ для любого неверного токена
            return Response({"valid": False}, status=404)

        participant = badge.participant
        event = participant.event
        template = BadgeTemplate.objects.filter(event=event).first()

        # Если шаблона нет, показываем только минимум
        show_name = template.show_name if template else True
        show_role = template.show_role if template else True

        payment, documents, admitted = admission(badge, participant)
        data = {
            "valid": badge.is_active,
            "payment": payment,
            "documents": documents,
            # Допуск на вход: бейдж активен, всё оплачено и обязательные документы приняты
            "admitted": admitted,
            "event": event.title,
        }
        if show_name:
            data["full_name"] = participant.full_name
        if show_role and participant.role_id:
            data["role"] = participant.role.name
        if template:
            data["background_color"] = template.background_color
            data["logo_url"] = template.logo_url
        return Response(data)
class BadgeQRView(APIView):
    """Картинка QR-кода (PNG) для печати на бейдже. Вход не нужен.

    QR ведёт на публичную страницу проверки на фронтенде."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        if not Badge.objects.filter(verification_token=token).exists():
            return Response({"valid": False}, status=404)

        url = f"{settings.PUBLIC_BASE_URL}/verify/{token}"
        img = qrcode.make(url, box_size=10, border=2)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return HttpResponse(buffer.getvalue(), content_type="image/png")


class MyBadgeView(APIView):
    """Гость (или любой вошедший участник) видит только свой бейдж."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        participant = get_participant(request.user)
        if participant is None:
            return Response({"detail": "Бейдж не найден."}, status=404)

        badge = Badge.objects.filter(participant=participant).first()
        if badge is None:
            return Response({"detail": "Бейдж ещё не выдан."}, status=404)

        template = BadgeTemplate.objects.filter(event=participant.event).first()
        token = str(badge.verification_token)
        payment, documents, admitted = admission(badge, participant)
        return Response({
            "valid": badge.is_active,
            "payment": payment,
            "documents": documents,
            "admitted": admitted,
            "event": participant.event.title,
            "full_name": participant.full_name,
            "role": participant.role.name if participant.role_id else None,
            "verification_token": token,
            "verify_url": f"{settings.PUBLIC_BASE_URL}/verify/{token}",
            "qr_image_url": request.build_absolute_uri(
                f"/api/public/badges/{token}/qr.png"
            ),
            "background_color": template.background_color if template else "#FFFFFF",
            "logo_url": template.logo_url if template else "",
        })
