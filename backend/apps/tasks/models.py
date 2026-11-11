from django.conf import settings
from django.db import models


class Task(models.Model):
    class Status(models.TextChoices):
        TODO = "TODO", "К выполнению"
        IN_PROGRESS = "IN_PROGRESS", "В работе"
        DONE = "DONE", "Выполнено"

    event = models.ForeignKey(
        "events.Event", on_delete=models.CASCADE, related_name="tasks"
    )
    title = models.CharField("Название", max_length=255)
    description = models.TextField("Описание", blank=True)
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
        verbose_name="Исполнитель",
    )
    status = models.CharField(
        "Статус", max_length=20, choices=Status.choices, default=Status.TODO
    )
    due_date = models.DateField("Срок", null=True, blank=True)
    due_time = models.TimeField("Время дедлайна", null=True, blank=True)
    responsible = models.ForeignKey(
        "events.TeamMember",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
        verbose_name="Ответственный",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["due_date", "due_time", "-created_at"]

    def __str__(self):
        return self.title
