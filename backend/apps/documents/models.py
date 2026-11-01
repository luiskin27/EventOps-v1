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
