from rest_framework import serializers
from .models import CompanySettings

class CompanySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanySettings
        fields = [
            'id',
            'tenant_id',
            'company_name',
            'logo',
            'theme_color',
            'address',
            'phone',
            'email',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_theme_color(self, value):
        if not value.startswith('#'):
            value = f'#{value}'
        return value 