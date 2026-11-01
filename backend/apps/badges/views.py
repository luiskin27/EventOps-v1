from rest_framework import viewsets

from .models import Badge, BadgeTemplate
from .serializers import BadgeSerializer, BadgeTemplateSerializer


class BadgeTemplateViewSet(viewsets.ModelViewSet):
    queryset = BadgeTemplate.objects.all()
    serializer_class = BadgeTemplateSerializer
    filterset_fields = ["event"]


class BadgeViewSet(viewsets.ModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    filterset_fields = ["participant", "is_active"]
