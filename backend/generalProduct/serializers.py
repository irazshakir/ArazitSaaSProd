from rest_framework import serializers
from .models import GeneralProduct

class GeneralProductSerializer(serializers.ModelSerializer):
    """Serializer for the GeneralProduct model."""
    
    tenant_name = serializers.SerializerMethodField()
    
    class Meta:
        model = GeneralProduct
        fields = ('id', 'tenant', 'tenant_name', 'productName', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_tenant_name(self, obj):
        return obj.tenant.name if obj.tenant else None 