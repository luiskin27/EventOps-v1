from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    DocumentTypeViewSet,
    DocumentViewSet,
    ParticipantDocumentFileView,
    ParticipantDocumentViewSet,
)

router = DefaultRouter()
router.register("documents", DocumentViewSet, basename="document")
router.register("document-types", DocumentTypeViewSet, basename="document-type")
router.register("participant-documents", ParticipantDocumentViewSet, basename="participant-document")

urlpatterns = [
    path(
        "participant-documents/<int:pk>/file/",
        ParticipantDocumentFileView.as_view(),
        name="participant-document-file",
    ),
    *router.urls,
]
