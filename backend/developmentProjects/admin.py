from django.contrib import admin
from .models import DevelopmentProject

@admin.register(DevelopmentProject)
class DevelopmentProjectAdmin(admin.ModelAdmin):
    list_display = ('project_name', 'property_type', 'listing_type', 'location', 'tenant_id')
    list_filter = ('property_type', 'listing_type')
    search_fields = ('project_name', 'location')
    readonly_fields = ('id', 'created_at', 'updated_at')
