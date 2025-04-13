from django.contrib import admin
from .models import CannedMessage

@admin.register(CannedMessage)
class CannedMessageAdmin(admin.ModelAdmin):
    """Admin for CannedMessage model."""
    list_display = ('template_name', 'tenant', 'created_by', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'tenant')
    search_fields = ('template_name', 'template_message', 'tenant__name')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('template_name', 'template_message')
        }),
        ('Metadata', {
            'fields': ('tenant', 'created_by', 'is_active', 'created_at', 'updated_at')
        }),
    )
