from django.conf import settings
from django.db import models

from apps.events.models import Event


class Role(models.Model):
    """Роль внутри события: организатор, вожатый, гость, охрана и т.д."""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="roles")
    name = models.CharField("Название роли", max_length=100)

    class Meta:
        verbose_name = "Роль"
        verbose_name_plural = "Роли"
        unique_together = ("event", "name")

    def __str__(self):
        return f"{self.name} ({self.event})"


class Participant(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="participations",
        verbose_name="Пользователь (если есть аккаунт)",
    )
    role = models.ForeignKey(
        Role, on_delete=models.SET_NULL, null=True, blank=True, related_name="participants"
    )
    full_name = models.CharField("ФИО", max_length=200)
    phone = models.CharField("Телефон", max_length=30, blank=True)
    email = models.EmailField("Email", blank=True)
    guest_code = models.CharField(
        "Короткий код для входа гостя", max_length=20, blank=True
    )
    notes = models.TextField("Заметки", blank=True)
    created_at = models.DateTimeField("Создан", auto_now_add=True)

    class Meta:
        verbose_name = "Участник"
        verbose_name_plural = "Участники"
        ordering = ["full_name"]

    def __str__(self):
        return f"{self.full_name} ({self.event})"
