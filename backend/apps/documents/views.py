from rest_framework import viewsets

from apps.participants.access import GuestScopedQuerysetMixin, StaffOrReadOnlyGuest

from .models import Document
from .serializers import DocumentSerializer


class DocumentViewSet(GuestScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    filterset_fields = ["event", "is_public"]
    permission_classes = [StaffOrReadOnlyGuest]
    guest_public_lookup = "is_public"
