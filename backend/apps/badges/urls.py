from rest_framework.routers import DefaultRouter

from .views import BadgeTemplateViewSet, BadgeViewSet

router = DefaultRouter()
router.register("badge-templates", BadgeTemplateViewSet, basename="badge-template")
router.register("badges", BadgeViewSet, basename="badge")

urlpatterns = router.urls
