from django.contrib import admin
from .models import HajjPackage

@admin.register(HajjPackage)
class HajjPackageAdmin(admin.ModelAdmin):
    list_display = ('package_name', 'tenant', 'hajj_start_date', 'hajj_end_date', 'created_by', 'assigned_to', 'is_active')
    list_filter = ('is_active', 'hajj_start_date', 'hajj_star', 'room_type')
    search_fields = ('package_name', 'hotel_makkah', 'hotel_medina')
    readonly_fields = ('created_at', 'updated_at')
