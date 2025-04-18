from rest_framework import serializers
from .models import LocationRouting

class LocationRoutingSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationRouting
        fields = ['id', 'tenant_id', 'locations', 'assigned_users', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate_locations(self, value):
        """
        Validate the locations JSONB field structure
        """
        if not isinstance(value, dict):
            raise serializers.ValidationError("Locations must be a dictionary")
        
        for city_key, city_data in value.items():
            if not isinstance(city_data, dict):
                raise serializers.ValidationError(f"City data for {city_key} must be a dictionary")
            
            required_fields = {'name', 'active'}
            if not all(field in city_data for field in required_fields):
                raise serializers.ValidationError(f"City data for {city_key} must contain {required_fields}")
        
        return value

    def validate_assigned_users(self, value):
        """
        Validate the assigned_users JSONB field structure
        """
        if not isinstance(value, dict):
            raise serializers.ValidationError("Assigned users must be a dictionary")
        
        for user_id, user_data in value.items():
            if not isinstance(user_data, dict):
                raise serializers.ValidationError(f"User data for {user_id} must be a dictionary")
            
            required_fields = {'name', 'count', 'active'}
            if not all(field in user_data for field in required_fields):
                raise serializers.ValidationError(f"User data for {user_id} must contain {required_fields}")
            
            if not isinstance(user_data['count'], (int, float)):
                raise serializers.ValidationError(f"Count for user {user_id} must be a number")
        
        return value

class LocationRoutingUpdateSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['add_location', 'remove_location', 'add_user', 'remove_user'])
    city_name = serializers.CharField(required=False)
    user_id = serializers.CharField(required=False)
    user_name = serializers.CharField(required=False)

    def validate(self, data):
        action = data.get('action')
        
        if action in ['add_location', 'remove_location'] and not data.get('city_name'):
            raise serializers.ValidationError("city_name is required for location actions")
        
        if action == 'add_user' and (not data.get('user_id') or not data.get('user_name')):
            raise serializers.ValidationError("user_id and user_name are required for add_user action")
        
        if action == 'remove_user' and not data.get('user_id'):
            raise serializers.ValidationError("user_id is required for remove_user action")
        
        return data 