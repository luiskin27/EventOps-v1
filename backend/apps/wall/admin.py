from django.contrib import admin

from .models import WallPost, WallSettings

admin.site.register(WallSettings)


@admin.register(WallPost)
class WallPostAdmin(admin.ModelAdmin):
    list_display = ("author_name", "event", "status", "created_at")
    list_filter = ("status", "event")
