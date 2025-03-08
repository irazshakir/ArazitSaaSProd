from rest_framework import serializers
from users.serializers import UserSerializer
from .models import HajjPackage

class HajjPackageSerializer(serializers.ModelSerializer):
    """Serializer for the HajjPackage model."""
    
    created_by_details = UserSerializer(source='created_by', read_only=True)
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    
    class Meta:
        model = HajjPackage
        fields = (
            'id', 'tenant', 'created_by', 'assigned_to', 'created_by_details', 'assigned_to_details',
            'package_name', 'hujjaj', 'hajj_days', 'hajj_star', 'hajj_start_date', 'hajj_end_date',
            'hotel_makkah', 'hotel_medina', 'maktab_no', 'room_type',
            'flight', 'flight_carrier', 'visa',
            'buying_price', 'selling_price',
            'created_at', 'updated_at', 'is_active'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')
    
    def create(self, validated_data):
        # Set the created_by field to the current user
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data) 