import io

import qrcode
from django.conf import settings
from django.http import HttpResponse
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.participants.access import get_participant

from .models import Badge, BadgeTemplate



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

        data = {
            "valid": badge.is_active,
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
        return Response({
            "valid": badge.is_active,
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
