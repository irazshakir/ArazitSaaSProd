from django.contrib import admin
from .models import HajjPackage

@admin.register(HajjPackage)
class HajjPackageAdmin(admin.ModelAdmin):
    list_display = ('package_name', 'tenant', 'departure_date', 'return_date', 'created_by', 'assigned_to', 'is_active')
    list_filter = ('is_active', 'departure_date', 'package_star', 'makkah_room_type', 'madinah_room_type')
    search_fields = ('package_name', 'hotel_makkah', 'hotel_madinah')
    readonly_fields = ('created_at', 'updated_at')
