from rest_framework.routers import DefaultRouter

from .views import EventViewSet, TeamMemberViewSet

router = DefaultRouter()
router.register("events", EventViewSet, basename="event")
router.register("team", TeamMemberViewSet, basename="team-member")

urlpatterns = router.urls
