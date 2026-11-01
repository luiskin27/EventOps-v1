from django.db import models


class Event(models.Model):
    class EventType(models.TextChoices):
        CAMP = "CAMP", "Лагерь"
        WEDDING = "WEDDING", "Свадьба"
        TRAINING = "TRAINING", "Корпоративное обучение"
        OTHER = "OTHER", "Другое"

    title = models.CharField("Название", max_length=200)
    event_type = models.CharField(
        "Тип события", max_length=20, choices=EventType.choices, default=EventType.OTHER
    )
    description = models.TextField("Описание", blank=True)
    location = models.CharField("Место проведения", max_length=255, blank=True)
    start_date = models.DateField("Дата начала", null=True, blank=True)
    end_date = models.DateField("Дата окончания", null=True, blank=True)
    is_active = models.BooleanField("Активно", default=True)
    created_at = models.DateTimeField("Создано", auto_now_add=True)

    class Meta:
        verbose_name = "Событие"
        verbose_name_plural = "События"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
