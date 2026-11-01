import uuid

from django.db import models


class BadgeTemplate(models.Model):
    """Шаблон бейджа: какие поля показывать на бейдже события."""

    event = models.OneToOneField(
        "events.Event", on_delete=models.CASCADE, related_name="badge_template"
    )
    show_name = models.BooleanField("Показывать имя", default=True)
    show_role = models.BooleanField("Показывать роль", default=True)
    show_team = models.BooleanField("Показывать группу/отряд", default=False)
    show_qr = models.BooleanField("Показывать QR-код", default=True)
    background_color = models.CharField("Цвет фона", max_length=7, default="#FFFFFF")
    logo_url = models.URLField("Логотип", max_length=1000, blank=True)

    def __str__(self):
        return f"Шаблон бейджа: {self.event}"


class Badge(models.Model):
    """Бейдж конкретного участника, QR-код ведёт на публичную страницу проверки."""

    participant = models.OneToOneField(
        "participants.Participant", on_delete=models.CASCADE, related_name="badge"
    )
    verification_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    issued_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField("Действителен", default=True)

    def __str__(self):
        return f"Бейдж: {self.participant}"
