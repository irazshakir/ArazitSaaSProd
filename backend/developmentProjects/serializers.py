from rest_framework import serializers
from .models import DevelopmentProject

class DevelopmentProjectSerializer(serializers.ModelSerializer):
    """Serializer for DevelopmentProject model"""
    
    property_type_display = serializers.CharField(source='get_property_type_display', read_only=True)
    listing_type_display = serializers.CharField(source='get_listing_type_display', read_only=True)
    
    class Meta:
        model = DevelopmentProject
        fields = [
            'id', 'tenant_id', 'project_name', 'property_type', 'property_type_display',
            'listing_type', 'listing_type_display', 'location', 'covered_size', 
            'features', 'project_image', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at'] 