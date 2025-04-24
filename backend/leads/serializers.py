from rest_framework import serializers
from users.serializers import UserSerializer, BranchSerializer
from hajjPackages.serializers import HajjPackageSerializer
from .models import (
    Lead, LeadActivity, LeadNote, LeadDocument, 
    LeadEvent, LeadProfile, LeadOverdue, Notification
)
from django.utils import timezone
from generalProduct.models import GeneralProduct

# First define serializers with no dependencies
class LeadListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing leads."""
    
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    lead_type_display = serializers.CharField(source='get_lead_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    branch_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Lead
        fields = (
            'id', 'name', 'email', 'phone', 'whatsapp',
            'lead_type', 'lead_type_display', 'status', 'status_display',
            'source', 'source_display', 'lead_activity_status',
            'assigned_to_details', 'created_at', 'next_follow_up',
            'branch', 'branch_details'
        )

    def get_branch_details(self, obj):
        if obj.branch:
            return {
                'id': obj.branch.id,
                'name': obj.branch.name
            }
        return None

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
        validated_data['added_by'] = self.context['request'].user
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
        validated_data['uploaded_by'] = self.context['request'].user
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
        validated_data['updated_by'] = self.context['request'].user
        if 'lead' in validated_data and not 'tenant' in validated_data:
            validated_data['tenant'] = validated_data['lead'].tenant
        return super().create(validated_data)

class LeadActivitySerializer(serializers.ModelSerializer):
    """Serializer for the LeadActivity model."""
    
    user_details = UserSerializer(source='user', read_only=True)
    lead_details = serializers.SerializerMethodField()
    due_date_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = LeadActivity
        fields = (
            'id', 'lead', 'tenant', 'user', 'user_details', 'lead_details',
            'activity_type', 'description', 'due_date', 'due_date_formatted',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'user', 'tenant')
    
    def get_due_date_formatted(self, obj):
        """Return formatted due date."""
        if obj.due_date:
            return obj.due_date.strftime('%d/%b/%Y %H:%M')
        return None
    
    def get_lead_details(self, obj):
        """Get simplified lead details to avoid circular imports."""
        if obj.lead:
            return {
                'id': obj.lead.id,
                'name': obj.lead.name,
                'phone': obj.lead.phone,
                'email': obj.lead.email,
                'status': obj.lead.status,
                'status_display': obj.lead.get_status_display(),
                'lead_type': obj.lead.lead_type,
                'lead_type_display': obj.lead.get_lead_type_display()
            }
        return None
    
    def create(self, validated_data):
        if 'lead' not in validated_data:
            raise serializers.ValidationError({'lead': 'Lead ID is required'})
        
        # These will be set in perform_create of the viewset
        validated_data.pop('user', None)
        validated_data.pop('tenant', None)
        
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

# Finally define LeadSerializer after all other serializers
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
    
    department_details = serializers.SerializerMethodField()
    branch_details = serializers.SerializerMethodField()
    development_project = serializers.CharField(required=False, allow_null=True)
    general_product_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Lead
        fields = (
            'id', 'tenant', 'created_by', 'assigned_to', 'created_by_details', 'assigned_to_details',
            'lead_type', 'lead_type_display', 'hajj_package', 'hajj_package_details',
            'name', 'email', 'phone', 'whatsapp', 'query_for',
            'status', 'status_display', 'source', 'source_display', 
            'lead_activity_status', 'activity_status_display',
            'created_at', 'updated_at', 'last_contacted', 'next_follow_up',
            'tags', 'custom_fields', 'flight', 'development_project',
            'activities', 'notes', 'documents', 'events',
            'department', 'department_details', 'branch', 'branch_details',
            'general_product_name'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')

    def get_general_product_name(self, obj):
        if obj.general_product:
            return obj.general_product.productName
        return None

    def get_department_details(self, obj):
        if obj.department:
            return {
                'id': obj.department.id,
                'name': obj.department.name
            }
        return None
        
    def get_branch_details(self, obj):
        if obj.branch:
            return {
                'id': obj.branch.id,
                'name': obj.branch.name
            }
        return None

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for the Notification model."""
    
    user_details = UserSerializer(source='user', read_only=True)
    lead_details = LeadSerializer(source='lead', read_only=True)
    lead_activity_details = LeadActivitySerializer(source='lead_activity', read_only=True)
    lead_overdue_details = LeadOverdueSerializer(source='lead_overdue', read_only=True)
    
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = (
            'id', 'tenant', 'user', 'user_details',
            'notification_type', 'notification_type_display',
            'title', 'message', 'status', 'status_display',
            'lead', 'lead_details',
            'lead_activity', 'lead_activity_details',
            'lead_overdue', 'lead_overdue_details',
            'created_at', 'read_at'
        )
        read_only_fields = ('id', 'created_at', 'read_at') 