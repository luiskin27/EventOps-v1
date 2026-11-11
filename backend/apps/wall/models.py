"""Стена поздравлений: гость сканирует QR на столе, без входа оставляет
текст и/или фото — поздравления показываются на экране в зале."""

import io
import os
import uuid

from django.core.files.base import ContentFile
from django.db import models


def wall_photo_path(instance, filename):
    return f"wall/{instance.event_id}/{uuid.uuid4().hex}.jpg"


class WallSettings(models.Model):
    class Moderation(models.TextChoices):
        BEFORE = "BEFORE", "Показывать после одобрения"
        AFTER = "AFTER", "Показывать сразу, лишнее скрывать"

    event = models.OneToOneField("events.Event", on_delete=models.CASCADE, related_name="wall")
    is_enabled = models.BooleanField("Приём поздравлений открыт", default=True)
    moderation = models.CharField("Модерация", max_length=10, choices=Moderation.choices, default=Moderation.BEFORE)
    title = models.CharField("Заголовок на экране", max_length=120, blank=True)
    # Две разные ссылки: QR на столах (оставить поздравление) и страница для проектора
    post_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    screen_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    class Meta:
        verbose_name = "Настройки стены"
        verbose_name_plural = "Настройки стены"

    def __str__(self):
        return f"Стена: {self.event}"

    @property
    def display_title(self):
        return self.title or self.event.title


class WallPost(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "На модерации"
        APPROVED = "APPROVED", "На экране"
        HIDDEN = "HIDDEN", "Скрыто"

    event = models.ForeignKey("events.Event", on_delete=models.CASCADE, related_name="wall_posts")
    author_name = models.CharField("Имя", max_length=80)
    relation = models.CharField("Кем приходится", max_length=80, blank=True)
    message = models.TextField("Поздравление", max_length=600, blank=True)
    photo = models.ImageField("Фото", upload_to=wall_photo_path, blank=True)
    status = models.CharField("Статус", max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField("Отправлено", auto_now_add=True)

    class Meta:
        verbose_name = "Поздравление"
        verbose_name_plural = "Поздравления"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.author_name}: {self.message[:40]}"

    def save(self, *args, **kwargs):
        # Фото с телефона бывают по 8–12 МБ: уменьшаем до 1600 px и JPEG — экран не тормозит
        if self.photo and not self.pk and hasattr(self.photo.file, "read"):
            from PIL import Image, ImageOps

            img = Image.open(self.photo)
            img = ImageOps.exif_transpose(img).convert("RGB")
            img.thumbnail((1600, 1600))
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85, optimize=True)
            self.photo.save(os.path.basename(self.photo.name), ContentFile(buf.getvalue()), save=False)
        super().save(*args, **kwargs)
