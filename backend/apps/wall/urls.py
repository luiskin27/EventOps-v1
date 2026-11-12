from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import PublicScreenView, PublicWallView, WallPostViewSet, WallQRView, WallSettingsViewSet

router = DefaultRouter()
router.register("wall-settings", WallSettingsViewSet, basename="wall-settings")
router.register("wall-posts", WallPostViewSet, basename="wall-post")

urlpatterns = [
    path("public/wall/<uuid:token>/", PublicWallView.as_view(), name="public-wall"),
    path("public/wall/<uuid:token>/qr.png", WallQRView.as_view(), name="public-wall-qr"),
    path("public/screen/<uuid:token>/", PublicScreenView.as_view(), name="public-screen"),
    *router.urls,
]
