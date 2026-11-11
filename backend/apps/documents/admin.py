from django.contrib import admin

from .models import Document, DocumentType, ParticipantDocument

admin.site.register(Document)


@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ("title", "event", "is_required", "order")
    list_filter = ("event",)


@admin.register(ParticipantDocument)
class ParticipantDocumentAdmin(admin.ModelAdmin):
    list_display = ("participant", "doc_type", "status", "created_at")
    list_filter = ("status", "doc_type__event")
