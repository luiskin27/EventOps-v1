from django.http import FileResponse, Http404
from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.participants.access import (
    GuestScopedQuerysetMixin,
    StaffOrGuestCreate,
    StaffOrReadOnlyGuest,
    get_participant,
)

from .models import Document, DocumentType, ParticipantDocument
from .serializers import (
    DocumentSerializer,
    DocumentTypeSerializer,
    GuestParticipantDocumentSerializer,
    ParticipantDocumentSerializer,
)


class DocumentViewSet(GuestScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    filterset_fields = ["event", "is_public"]
    permission_classes = [StaffOrReadOnlyGuest]
    guest_public_lookup = "is_public"


class DocumentTypeViewSet(GuestScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = DocumentType.objects.all()
    serializer_class = DocumentTypeSerializer
    filterset_fields = ["event"]
    permission_classes = [StaffOrReadOnlyGuest]


class ParticipantDocumentViewSet(viewsets.ModelViewSet):
    """Организатор: очередь проверки, решение. Участник: свои документы + загрузка."""

    queryset = ParticipantDocument.objects.select_related("participant__role", "doc_type")
    filterset_fields = ["status", "doc_type", "participant", "doc_type__event"]
    permission_classes = [StaffOrGuestCreate]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.request.user.is_staff:
            return ParticipantDocumentSerializer
        return GuestParticipantDocumentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_staff:
            return qs
        me = get_participant(self.request.user)
        return qs.filter(participant=me) if me else qs.none()

    def perform_create(self, serializer):
        if self.request.user.is_staff:
            serializer.save()
        else:
            serializer.save(
                participant=get_participant(self.request.user),
                status=ParticipantDocument.Status.PENDING,
            )

    def perform_update(self, serializer):
        serializer.save(reviewed_by=self.request.user)


class ParticipantDocumentFileView(APIView):
    """Файл документа отдаётся только организатору или самому участнику (по JWT)."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            doc = ParticipantDocument.objects.select_related("participant").get(pk=pk)
        except ParticipantDocument.DoesNotExist:
            raise Http404
        if not request.user.is_staff:
            me = get_participant(request.user)
            if me is None or doc.participant_id != me.pk:
                raise Http404
        return FileResponse(doc.file.open("rb"), filename=doc.original_name or None)
