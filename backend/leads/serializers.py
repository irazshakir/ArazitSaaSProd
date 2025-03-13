from rest_framework import serializers
from users.serializers import UserSerializer
from hajjPackages.serializers import HajjPackageSerializer
from .models import Lead, LeadActivity

class LeadActivitySerializer(serializers.ModelSerializer):
    """Serializer for the LeadActivity model."""
    
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = LeadActivity
        fields = (
            'id', 'lead', 'user', 'user_details', 'activity_type', 'description',
            'duration', 'due_date', 'completed', 'completed_at',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        # Set the user to the current user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class LeadSerializer(serializers.ModelSerializer):
    """Serializer for the Lead model."""
    
    created_by_details = UserSerializer(source='created_by', read_only=True)
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    hajj_package_details = HajjPackageSerializer(source='hajj_package', read_only=True)
    activities = LeadActivitySerializer(many=True, read_only=True)
    
    class Meta:
        model = Lead
        fields = (
            'id', 'tenant', 'created_by', 'assigned_to', 'created_by_details', 'assigned_to_details',
            'lead_type', 'hajj_package', 'hajj_package_details',
            'first_name', 'last_name', 'email', 'phone', 'company',
            'status', 'source', 'notes',
            'estimated_value', 'actual_value',
            'created_at', 'updated_at', 'last_contacted', 'next_follow_up',
            'tags', 'custom_fields', 'activities'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')
    
    def create(self, validated_data):
        # Set the created_by field to the current user
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class LeadListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing leads."""
    
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    full_name = serializers.SerializerMethodField()
    lead_type_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Lead
        fields = (
            'id', 'full_name', 'email', 'phone', 
            'lead_type', 'lead_type_display', 'status', 'status_display',
            'assigned_to_details', 'created_at', 'next_follow_up'
        )
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
    def get_lead_type_display(self, obj):
        return obj.get_lead_type_display()
    
    def get_status_display(self, obj):
        return obj.get_status_display() 