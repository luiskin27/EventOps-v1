from django.db import models


class Event(models.Model):
    class EventType(models.TextChoices):
        WEDDING = "WEDDING", "Свадьба"
        CAMP = "CAMP", "Лагерь"
        TRAINING = "TRAINING", "Корпоративное обучение"
        OTHER = "OTHER", "Другое"

    title = models.CharField("Название", max_length=200)
    event_type = models.CharField(
        "Тип события", max_length=20, choices=EventType.choices, default=EventType.WEDDING
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


class TeamMember(models.Model):
    """Команда мероприятия: тамада, диджей, фотограф, повар. Аккаунт не нужен."""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="team")
    full_name = models.CharField("Имя", max_length=200)
    position = models.CharField("Должность", max_length=120)
    phone = models.CharField("Телефон", max_length=40, blank=True)
    notes = models.CharField("Заметка", max_length=500, blank=True)

    class Meta:
        verbose_name = "Член команды"
        verbose_name_plural = "Команда"
        ordering = ["position", "full_name"]

    def __str__(self):
        return f"{self.full_name} · {self.position}"
