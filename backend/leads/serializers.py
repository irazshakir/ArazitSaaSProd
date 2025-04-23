from rest_framework import serializers
from users.serializers import UserSerializer, BranchSerializer
from hajjPackages.serializers import HajjPackageSerializer
from .models import (
    Lead, LeadActivity, LeadNote, LeadDocument, 
    LeadEvent, LeadProfile, LeadOverdue, Notification
)
from django.utils import timezone
from generalProduct.models import GeneralProduct

class LeadActivitySerializer(serializers.ModelSerializer):
    """Serializer for the LeadActivity model."""
    
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = LeadActivity
        fields = (
            'id', 'lead', 'tenant', 'user', 'user_details', 
            'activity_type', 'description', 'due_date',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        # Ensure the lead is provided
        if 'lead' not in validated_data:
            raise serializers.ValidationError({'lead': 'Lead ID is required'})
            
        # Set the user to the current user
        validated_data['user'] = self.context['request'].user
        # Set the tenant to the lead's tenant
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
    
    department_details = serializers.SerializerMethodField()
    branch_details = serializers.SerializerMethodField()
    
    # Add development_project field
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

    def validate(self, data):
        # Get the tenant from the context
        tenant = self.context.get('tenant')
        if not tenant:
            raise serializers.ValidationError("Tenant information is required")
        
        lead_type = data.get('lead_type')
        if not lead_type:
            raise serializers.ValidationError("Lead type is required")

        # Check if it's a predefined lead type
        predefined_types = dict(Lead.TYPE_CHOICES)
        if lead_type in predefined_types:
            return data

        # If not a predefined type, try to find matching general product
        try:
            product = GeneralProduct.objects.filter(
                tenant=tenant,
                productName__iexact=lead_type.replace('_', ' ')
            ).first()
            
            if product:
                data['general_product'] = product
            else:
                raise serializers.ValidationError(
                    f"Invalid lead type '{lead_type}'. Must be either a predefined type or match a general product."
                )
        except Exception as e:
            raise serializers.ValidationError(f"Error validating lead type: {str(e)}")

        return data

    def create(self, validated_data):
        # If this is a general product lead, ensure the relationship is set
        lead_type = validated_data.get('lead_type')
        if lead_type not in dict(Lead.TYPE_CHOICES):
            # The general_product should have been set in validate()
            if 'general_product' not in validated_data:
                raise serializers.ValidationError(
                    "General product reference is required for custom lead types"
                )

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
        
    def update(self, instance, validated_data):
        """
        Override update method to ensure we properly track user for lead events
        """
        request = self.context.get('request')
        user = request.user if request else None
        
        # Store the current status and activity status before updating
        original_status = instance.status
        original_activity_status = instance.lead_activity_status
        
        # Update the instance with all validated data
        lead = super().update(instance, validated_data)
        
        # Check for status changes that require events to be created manually
        # This will be a fallback in case the model's save method didn't capture it
        # or we need to use the request's user instead of assigned_to/created_by
        
        # Status change to won
        if original_status != lead.status and lead.status == lead.STATUS_WON and user:
            existing_event = LeadEvent.objects.filter(
                lead=lead,
                event_type=LeadEvent.EVENT_WON,
                timestamp__gte=timezone.now() - timezone.timedelta(minutes=1)
            ).exists()
            
            if not existing_event:
                LeadEvent.objects.create(
                    lead=lead,
                    tenant=lead.tenant,
                    event_type=LeadEvent.EVENT_WON,
                    updated_by=user
                )
                
        # Status change to lost
        elif original_status != lead.status and lead.status == lead.STATUS_LOST and user:
            existing_event = LeadEvent.objects.filter(
                lead=lead,
                event_type=LeadEvent.EVENT_LOST,
                timestamp__gte=timezone.now() - timezone.timedelta(minutes=1)
            ).exists()
            
            if not existing_event:
                LeadEvent.objects.create(
                    lead=lead,
                    tenant=lead.tenant,
                    event_type=LeadEvent.EVENT_LOST,
                    updated_by=user
                )
                
        # Activity status change to inactive
        if original_activity_status != lead.lead_activity_status and lead.lead_activity_status == lead.ACTIVITY_STATUS_INACTIVE and user:
            existing_event = LeadEvent.objects.filter(
                lead=lead,
                event_type=LeadEvent.EVENT_CLOSED,
                timestamp__gte=timezone.now() - timezone.timedelta(minutes=1)
            ).exists()
            
            if not existing_event:
                LeadEvent.objects.create(
                    lead=lead,
                    tenant=lead.tenant,
                    event_type=LeadEvent.EVENT_CLOSED,
                    updated_by=user
                )
                
        # Activity status change from inactive to active
        elif original_activity_status != lead.lead_activity_status and lead.lead_activity_status == lead.ACTIVITY_STATUS_ACTIVE and user:
            existing_event = LeadEvent.objects.filter(
                lead=lead,
                event_type=LeadEvent.EVENT_REOPENED,
                timestamp__gte=timezone.now() - timezone.timedelta(minutes=1)
            ).exists()
            
            if not existing_event:
                LeadEvent.objects.create(
                    lead=lead,
                    tenant=lead.tenant,
                    event_type=LeadEvent.EVENT_REOPENED,
                    updated_by=user
                )
                
        return lead

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

    def get_full_name(self, obj):
        return obj.name  # Use name directly instead of combining first_name and last_name
        
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