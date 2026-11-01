import re

from django.contrib.auth import get_user_model
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Participant

User = get_user_model()


def normalize_phone(raw: str) -> str:
    """Оставляет только цифры: '+996 (789) 987-987' -> '996789987987'."""
    return re.sub(r"\D", "", raw or "")


class GuestLoginSerializer(serializers.Serializer):
    phone = serializers.CharField()
    code = serializers.CharField()


class GuestLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = GuestLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = normalize_phone(serializer.validated_data["phone"])
        code = serializer.validated_data["code"].strip().upper()

        participant = None
        if phone and code:
            for candidate in Participant.objects.filter(guest_code__iexact=code):
                if normalize_phone(candidate.phone) == phone:
                    participant = candidate
                    break

        if participant is None:
            return Response(
                {"detail": "Неверный телефон или код."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if participant.user is None:
            user = User.objects.create(username=f"guest_{participant.pk}")
            user.set_unusable_password()
            user.save()
            participant.user = user
            participant.save(update_fields=["user"])

        refresh = RefreshToken.for_user(participant.user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "participant": {
                    "id": participant.pk,
                    "full_name": participant.full_name,
                    "event": participant.event_id,
                },
            }
        )
