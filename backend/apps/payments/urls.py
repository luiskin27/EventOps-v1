from rest_framework.routers import DefaultRouter

from .views import PaymentItemViewSet, PaymentViewSet

router = DefaultRouter()
router.register("payment-items", PaymentItemViewSet, basename="payment-item")
router.register("payments", PaymentViewSet, basename="payment")

urlpatterns = router.urls
