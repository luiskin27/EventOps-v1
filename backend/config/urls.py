from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.badges.public import BadgeQRView, MyBadgeView, PublicBadgeVerifyView
from apps.participants.exports import ParticipantsCSVExportView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path(
        "api/events/<int:event_id>/export/participants.csv",
        ParticipantsCSVExportView.as_view(),
        name="participants_csv_export",
    ),
    path("api/", include("apps.events.urls")),
    path("api/", include("apps.participants.urls")),
    path("api/", include("apps.payments.urls")),
    path("api/", include("apps.tasks.urls")),
    path("api/", include("apps.schedule.urls")),
    path("api/", include("apps.documents.urls")),
    path("api/", include("apps.badges.urls")),
    path("api/public/badges/<uuid:token>/", PublicBadgeVerifyView.as_view()),
    path("api/public/badges/<uuid:token>/qr.png", BadgeQRView.as_view()),
    path("api/my/badge/", MyBadgeView.as_view()),
]
