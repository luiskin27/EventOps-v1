from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .access import get_participant


class MeView(APIView):
    """Кто я: фронт по этому ответу решает, какой интерфейс показать.

    Роль определяет backend (is_staff / привязка к участнику), а не выбор на фронте."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        participant = get_participant(user)
        data = {
            "id": user.pk,
            "username": user.username,
            "full_name": user.get_full_name(),
            "is_staff": user.is_staff,
            "kind": "staff" if user.is_staff else ("guest" if participant else "unknown"),
            "participant": None,
        }
        if participant:
            data["participant"] = {
                "id": participant.pk,
                "full_name": participant.full_name,
                "event": participant.event_id,
                "event_title": participant.event.title,
                "role": participant.role.name if participant.role_id else None,
            }
        return Response(data)
