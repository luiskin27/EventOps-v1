from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import PublicScheduleView, ScheduleItemViewSet, ScheduleLinkViewSet

router = DefaultRouter()
router.register("schedule-links", ScheduleLinkViewSet, basename="schedule-link")
router.register("schedule", ScheduleItemViewSet, basename="schedule-item")

urlpatterns = [
    path("public/schedule/<uuid:token>/", PublicScheduleView.as_view(), name="public-schedule"),
    *router.urls,
]
