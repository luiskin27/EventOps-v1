from django.contrib import admin

from .models import Payment, PaymentItem


@admin.register(PaymentItem)
class PaymentItemAdmin(admin.ModelAdmin):
    list_display = ("title", "event", "amount", "currency")
    list_filter = ("event",)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("participant", "item", "status", "created_at")
    list_filter = ("status", "item__event")
    search_fields = ("participant__full_name",)
