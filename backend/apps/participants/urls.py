from django.urls import path
from rest_framework.routers import DefaultRouter

from .guest_auth import GuestLoginView
from .views import ParticipantViewSet, RoleViewSet

router = DefaultRouter()
router.register("roles", RoleViewSet, basename="role")
router.register("participants", ParticipantViewSet, basename="participant")

urlpatterns = [
    path("guest/login/", GuestLoginView.as_view(), name="guest-login"),
] + router.urls
