from rest_framework.routers import DefaultRouter

from .views import ScheduleItemViewSet

router = DefaultRouter()
router.register("schedule", ScheduleItemViewSet, basename="schedule-item")

urlpatterns = router.urls
