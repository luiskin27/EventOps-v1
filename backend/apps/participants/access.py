from rest_framework.permissions import SAFE_METHODS, BasePermission


def get_participant(user):
    """Участник, привязанный к пользователю (или None для администратора)."""
    if not user or not user.is_authenticated:
        return None
    from .models import Participant

    return Participant.objects.filter(user=user).first()


class StaffOrReadOnlyGuest(BasePermission):
    """Staff может всё. Гость (привязанный участник) только читает."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_staff:
            return True
        return request.method in SAFE_METHODS and get_participant(user) is not None
class IsStaff(BasePermission):
    """Доступ только персоналу (администраторам и организаторам)."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff)
