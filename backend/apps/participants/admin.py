from django.contrib import admin

from .models import Participant, Role


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "event")
    list_filter = ("event",)


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ("full_name", "phone", "event", "role")
    list_filter = ("event", "role")
    search_fields = ("full_name", "phone", "email")
