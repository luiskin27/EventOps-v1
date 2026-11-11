import uuid

from django.db import models


class Audience(models.TextChoices):
    GUESTS = "GUESTS", "Гости"
    HOSTS = "HOSTS", "Ведущий и диджей"
    STAFF = "STAFF", "Персонал"
    TEAM = "TEAM", "Организаторы"


class ScheduleItem(models.Model):
    event = models.ForeignKey(
        "events.Event", on_delete=models.CASCADE, related_name="schedule_items"
    )
    title = models.CharField("Название", max_length=255)
    description = models.TextField("Описание", blank=True)
    location = models.CharField("Место", max_length=255, blank=True)
    starts_at = models.DateTimeField("Начало")
    ends_at = models.DateTimeField("Окончание", null=True, blank=True)
    audience = models.CharField("Для кого", max_length=10, choices=Audience.choices, default=Audience.GUESTS)
    # Оставлено для совместимости: True, когда пункт для гостей
    is_public = models.BooleanField("Виден гостям", default=True)

    class Meta:
        ordering = ["starts_at"]

    def save(self, *args, **kwargs):
        self.is_public = self.audience == Audience.GUESTS
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.starts_at:%d.%m %H:%M})"


class ScheduleLink(models.Model):
    """Ссылка без входа: тамада, диджей или персонал видят только своё расписание."""

    event = models.ForeignKey("events.Event", on_delete=models.CASCADE, related_name="schedule_links")
    audience = models.CharField("Для кого", max_length=10, choices=Audience.choices)
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("event", "audience")]

    # Гостевые пункты (торт, первый танец) нужны всем, поэтому видны в каждой ссылке
    def visible_audiences(self):
        return {self.audience, Audience.GUESTS}
