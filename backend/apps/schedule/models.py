from django.db import models


class ScheduleItem(models.Model):
    event = models.ForeignKey(
        "events.Event", on_delete=models.CASCADE, related_name="schedule_items"
    )
    title = models.CharField("Название", max_length=255)
    description = models.TextField("Описание", blank=True)
    location = models.CharField("Место", max_length=255, blank=True)
    starts_at = models.DateTimeField("Начало")
    ends_at = models.DateTimeField("Окончание", null=True, blank=True)
    is_public = models.BooleanField("Виден гостям", default=True)

    class Meta:
        ordering = ["starts_at"]

    def __str__(self):
        return f"{self.title} ({self.starts_at:%d.%m %H:%M})"
