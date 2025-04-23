from django.contrib import admin
from .models import GeneralProduct

@admin.register(GeneralProduct)
class GeneralProductAdmin(admin.ModelAdmin):
    list_display = ('productName', 'tenant', 'created_at', 'updated_at')
    list_filter = ('tenant', 'created_at')
    search_fields = ('productName', 'tenant__name')
    ordering = ('-created_at',) 