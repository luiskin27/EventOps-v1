from django.db import models


class Document(models.Model):
    event = models.ForeignKey(
        "events.Event", on_delete=models.CASCADE, related_name="documents"
    )
    title = models.CharField("Название", max_length=255)
    file_url = models.URLField("Ссылка на файл", max_length=1000)
    is_public = models.BooleanField("Виден гостям", default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.title


def participant_doc_path(instance, filename):
    """Случайное имя файла: ссылку на скан паспорта нельзя угадать."""
    import os
    import uuid

    ext = os.path.splitext(filename)[1].lower()[:10]
    return f"participant_docs/{instance.participant.event_id}/{uuid.uuid4().hex}{ext}"


class DocumentType(models.Model):
    """Какой документ участник должен загрузить: удостоверение, справка, согласие."""

    event = models.ForeignKey(
        "events.Event", on_delete=models.CASCADE, related_name="document_types"
    )
    title = models.CharField("Название", max_length=200)
    description = models.CharField("Подсказка для участника", max_length=500, blank=True)
    is_required = models.BooleanField("Обязателен для допуска", default=True)
    order = models.PositiveSmallIntegerField("Порядок", default=0)

    class Meta:
        verbose_name = "Тип документа"
        verbose_name_plural = "Типы документов"
        ordering = ["order", "id"]

    def __str__(self):
        return self.title


class ParticipantDocument(models.Model):
    """Файл, загруженный участником. Каждая повторная загрузка — новая запись."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "На проверке"
        APPROVED = "APPROVED", "Подтверждён"
        REJECTED = "REJECTED", "Отклонён"

    participant = models.ForeignKey(
        "participants.Participant", on_delete=models.CASCADE, related_name="documents"
    )
    doc_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE, related_name="uploads")
    file = models.FileField("Файл", upload_to=participant_doc_path)
    original_name = models.CharField("Имя файла", max_length=255, blank=True)
    size = models.PositiveIntegerField("Размер, байт", default=0)
    status = models.CharField("Статус", max_length=20, choices=Status.choices, default=Status.PENDING)
    admin_comment = models.TextField("Комментарий для участника", blank=True)
    reviewed_by = models.ForeignKey(
        "auth.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    created_at = models.DateTimeField("Загружен", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлён", auto_now=True)

    class Meta:
        verbose_name = "Документ участника"
        verbose_name_plural = "Документы участников"
        ordering = ["created_at"]  # в очереди проверки старые сверху

    def __str__(self):
        return f"{self.participant.full_name}: {self.doc_type.title} [{self.status}]"
