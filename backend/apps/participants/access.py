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


class GuestScopedQuerysetMixin:
    """Staff видит всё. Гость — только объекты своего события.

    guest_event_lookup  — путь до события (например "event" или "pk" для Event).
    guest_public_lookup — если задан, гость видит только объекты с этим флагом = True.
    """

    guest_event_lookup = "event"
    guest_public_lookup = None

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_staff:
            return qs
        me = get_participant(user)
        if me is None:
            return qs.none()
        qs = qs.filter(**{self.guest_event_lookup: me.event_id})
        if self.guest_public_lookup:
            qs = qs.filter(**{self.guest_public_lookup: True})
        return qs


class StaffOrGuestCreate(BasePermission):
    """Staff может всё. Гость — читать и создавать (например, загрузить чек)."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_staff:
            return True
        if get_participant(user) is None:
            return False
        return request.method in SAFE_METHODS or request.method == "POST"
