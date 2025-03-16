from rest_framework import serializers
from users.serializers import UserSerializer
from hajjPackages.serializers import HajjPackageSerializer
from .models import (
    Lead, LeadActivity, LeadNote, LeadDocument, 
    LeadEvent, LeadProfile, LeadOverdue
)

class LeadActivitySerializer(serializers.ModelSerializer):
    """Serializer for the LeadActivity model."""
    
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = LeadActivity
        fields = (
            'id', 'lead', 'tenant', 'user', 'user_details', 'activity_type', 'description',
            'duration', 'due_date', 'completed', 'completed_at',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        # Set the user to the current user
        validated_data['user'] = self.context['request'].user
        # Set the tenant to the lead's tenant
        if 'lead' in validated_data and not 'tenant' in validated_data:
            validated_data['tenant'] = validated_data['lead'].tenant
        return super().create(validated_data)


class LeadNoteSerializer(serializers.ModelSerializer):
    """Serializer for the LeadNote model."""
    
    added_by_details = UserSerializer(source='added_by', read_only=True)
    
    class Meta:
        model = LeadNote
        fields = (
            'id', 'lead', 'tenant', 'note', 'timestamp', 
            'added_by', 'added_by_details'
        )
        read_only_fields = ('id', 'timestamp', 'added_by')
    
    def create(self, validated_data):
        # Set the added_by to the current user
        validated_data['added_by'] = self.context['request'].user
        # Set the tenant to the lead's tenant
        if 'lead' in validated_data and not 'tenant' in validated_data:
            validated_data['tenant'] = validated_data['lead'].tenant
        return super().create(validated_data)


class LeadDocumentSerializer(serializers.ModelSerializer):
    """Serializer for the LeadDocument model."""
    
    uploaded_by_details = UserSerializer(source='uploaded_by', read_only=True)
    
    class Meta:
        model = LeadDocument
        fields = (
            'id', 'lead', 'tenant', 'document_name',
            'document_path', 'uploaded_by', 'uploaded_by_details', 'timestamp'
        )
        read_only_fields = ('id', 'timestamp', 'uploaded_by')
    
    def create(self, validated_data):
        # Set the uploaded_by to the current user
        validated_data['uploaded_by'] = self.context['request'].user
        # Set the tenant to the lead's tenant
        if 'lead' in validated_data and not 'tenant' in validated_data:
            validated_data['tenant'] = validated_data['lead'].tenant
        return super().create(validated_data)


class LeadEventSerializer(serializers.ModelSerializer):
    """Serializer for the LeadEvent model."""
    
    updated_by_details = UserSerializer(source='updated_by', read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    
    class Meta:
        model = LeadEvent
        fields = (
            'id', 'lead', 'tenant', 'event_type', 'event_type_display',
            'timestamp', 'updated_by', 'updated_by_details'
        )
        read_only_fields = ('id', 'timestamp', 'updated_by')
    
    def create(self, validated_data):
        # Set the updated_by to the current user
        validated_data['updated_by'] = self.context['request'].user
        # Set the tenant to the lead's tenant
        if 'lead' in validated_data and not 'tenant' in validated_data:
            validated_data['tenant'] = validated_data['lead'].tenant
        return super().create(validated_data)


class LeadProfileSerializer(serializers.ModelSerializer):
    """Serializer for the LeadProfile model."""
    
    buying_level_display = serializers.CharField(source='get_buying_level_display', read_only=True)
    
    class Meta:
        model = LeadProfile
        fields = (
            'id', 'lead', 'tenant', 'qualified_lead', 'buying_level', 'buying_level_display',
            'previous_purchase', 'previous_purchase_amount',
            'engagement_score', 'response_time_score', 'budget_match_score', 'overall_score',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'overall_score')
    
    def create(self, validated_data):
        # Set the tenant to the lead's tenant
        if 'lead' in validated_data and not 'tenant' in validated_data:
            validated_data['tenant'] = validated_data['lead'].tenant
        return super().create(validated_data)


class LeadOverdueSerializer(serializers.ModelSerializer):
    """Serializer for the LeadOverdue model."""
    
    lead_user_details = UserSerializer(source='lead_user', read_only=True)
    
    class Meta:
        model = LeadOverdue
        fields = (
            'id', 'lead', 'tenant', 'overdue', 'lead_user', 'lead_user_details',
            'timestamp', 'resolved_at'
        )
        read_only_fields = ('id', 'timestamp')


class LeadSerializer(serializers.ModelSerializer):
    """Serializer for the Lead model."""
    
    created_by_details = UserSerializer(source='created_by', read_only=True)
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    hajj_package_details = HajjPackageSerializer(source='hajj_package', read_only=True)
    
    # Related data
    activities = LeadActivitySerializer(many=True, read_only=True)
    notes = LeadNoteSerializer(many=True, read_only=True)
    documents = LeadDocumentSerializer(many=True, read_only=True)
    events = LeadEventSerializer(many=True, read_only=True)
    
    # Display fields
    lead_type_display = serializers.CharField(source='get_lead_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    activity_status_display = serializers.CharField(source='get_lead_activity_status_display', read_only=True)
    
    class Meta:
        model = Lead
        fields = (
            'id', 'tenant', 'created_by', 'assigned_to', 'created_by_details', 'assigned_to_details',
            'lead_type', 'lead_type_display', 'hajj_package', 'hajj_package_details',
            'name', 'email', 'phone', 'whatsapp', 'query_for',
            'status', 'status_display', 'source', 'source_display', 
            'lead_activity_status', 'activity_status_display',
            'created_at', 'updated_at', 'last_contacted', 'next_follow_up',
            'tags', 'custom_fields',
            'activities', 'notes', 'documents', 'events'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')
    
    def create(self, validated_data):
        # Set the created_by field to the current user
        validated_data['created_by'] = self.context['request'].user
        
        # Create the lead
        lead = super().create(validated_data)
        
        # Create an initial open event
        LeadEvent.objects.create(
            lead=lead,
            tenant=lead.tenant,
            event_type=LeadEvent.EVENT_OPEN,
            updated_by=self.context['request'].user
        )
        
        return lead


class LeadListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing leads."""
    
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    lead_type_display = serializers.CharField(source='get_lead_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    
    class Meta:
        model = Lead
        fields = (
            'id', 'name', 'email', 'phone', 'whatsapp',
            'lead_type', 'lead_type_display', 'status', 'status_display',
            'source', 'source_display', 'lead_activity_status',
            'assigned_to_details', 'created_at', 'next_follow_up'
        ) 

    def get_full_name(self, obj):
        return obj.name  # Use name directly instead of combining first_name and last_name 