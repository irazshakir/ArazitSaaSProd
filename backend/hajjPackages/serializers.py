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
            'package_name', 'visa', 'ziyarat', 'flight_carrier',
            'package_star', 'hajj_days', 'departure_date', 'return_date', 'maktab_no',
            'hotel_makkah', 'makkah_star', 'makkah_check_in', 'makkah_check_out', 'makkah_room_type', 'makkah_nights',
            'hotel_madinah', 'madinah_star', 'madinah_check_in', 'madinah_check_out', 'madinah_room_type', 'madinah_nights',
            'total_cost', 'selling_price',
            'tags', 'image',
            'created_at', 'updated_at', 'is_active'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')
    
    def create(self, validated_data):
        # Set the created_by field to the current user
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data) 