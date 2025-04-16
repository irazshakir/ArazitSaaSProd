from django.contrib import admin
from .models import CompanySettings

@admin.register(CompanySettings)
class CompanySettingsAdmin(admin.ModelAdmin):
    list_display = ['tenant_id', 'company_name', 'email', 'phone', 'created_at', 'updated_at']
    search_fields = ['tenant_id', 'company_name', 'email']
    readonly_fields = ['created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Company Information', {
            'fields': ('tenant_id', 'company_name', 'logo', 'theme_color')
        }),
        ('Contact Information', {
            'fields': ('address', 'phone', 'email')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    ) 