"""Стена поздравлений: гость сканирует QR на столе, без входа оставляет
текст и/или фото — поздравления показываются на экране в зале."""

import io
import os
import uuid

from django.core.files.base import ContentFile
from django.db import models


def wall_photo_path(instance, filename):
    return f"wall/{instance.event_id}/{uuid.uuid4().hex}.jpg"


def wall_bg_path(instance, filename):
    return f"wall/{instance.event_id}/bg_{uuid.uuid4().hex}.jpg"


def shrink_image(field, max_side):
    """Фото с телефона бывают по 8–12 МБ: уменьшаем и сохраняем в JPEG."""
    from PIL import Image, ImageOps

    img = Image.open(field)
    img = ImageOps.exif_transpose(img).convert("RGB")
    img.thumbnail((max_side, max_side))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85, optimize=True)
    field.save(os.path.basename(field.name), ContentFile(buf.getvalue()), save=False)


class WallSettings(models.Model):
    class Moderation(models.TextChoices):
        BEFORE = "BEFORE", "Показывать после одобрения"
        AFTER = "AFTER", "Показывать сразу, лишнее скрывать"

    class Mode(models.TextChoices):
        BOARD = "BOARD", "Доска: все пожелания вместе"
        SLIDES = "SLIDES", "По одному, крупно"

    event = models.OneToOneField("events.Event", on_delete=models.CASCADE, related_name="wall")
    is_enabled = models.BooleanField("Приём поздравлений открыт", default=True)
    moderation = models.CharField("Модерация", max_length=10, choices=Moderation.choices, default=Moderation.BEFORE)
    title = models.CharField("Заголовок на экране", max_length=120, blank=True)
    display_mode = models.CharField("Вид экрана", max_length=10, choices=Mode.choices, default=Mode.BOARD)
    background = models.ImageField("Фон экрана (например, фото молодых)", upload_to=wall_bg_path, blank=True)
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

    def save(self, *args, **kwargs):
        if self.background and not self.background._committed:  # только что загружен
            shrink_image(self.background, 2560)
        super().save(*args, **kwargs)


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
        if self.photo and not self.photo._committed:
            shrink_image(self.photo, 1600)
        super().save(*args, **kwargs)
