from rest_framework import serializers
from .models import FacebookWebhookHistory, FacebookIntegrationSettings
from users.models import Tenant, User
from leads.models import Lead
from django.utils import timezone
import json

class FacebookIntegrationSettingsSerializer(serializers.ModelSerializer):
    """Serializer for tenant-specific Facebook integration settings."""
    
    webhook_url = serializers.SerializerMethodField()
    default_assigned_to_name = serializers.SerializerMethodField()
    
    class Meta:
        model = FacebookIntegrationSettings
        fields = (
            'id', 'tenant', 'is_active', 'albato_integration_id',
            'webhook_secret', 'default_assigned_to', 'default_assigned_to_name',
            'webhook_url', 'created_at', 'updated_at', 'default_department', 'default_lead_type'
        )
        read_only_fields = ('id', 'webhook_url', 'created_at', 'updated_at', 'default_assigned_to_name')

    def validate(self, data):
        """Validate the entire data set."""
        # Ensure default_assigned_to is a list if provided
        if 'default_assigned_to' in data:
            if not isinstance(data['default_assigned_to'], list):
                raise serializers.ValidationError({
                    "default_assigned_to": "Must be a list of user IDs"
                })
            
            # Validate that all user IDs exist
            try:
                user_ids = data['default_assigned_to']
                existing_users = User.objects.filter(id__in=user_ids).values_list('id', flat=True)
                missing_users = set(str(uid) for uid in user_ids) - set(str(uid) for uid in existing_users)
                
                if missing_users:
                    raise serializers.ValidationError({
                        "default_assigned_to": f"Users with IDs {missing_users} do not exist"
                    })
            except Exception as e:
                raise serializers.ValidationError({
                    "default_assigned_to": "Error validating user IDs"
                })
        
        return data
    
    def get_webhook_url(self, obj):
        """Get the webhook URL for this tenant."""
        try:
            return obj.get_webhook_url()
        except Exception as e:
            return None
    
    def get_default_assigned_to_name(self, obj):
        """Get the names of the default assigned users."""
        try:
            if not obj.default_assigned_to:
                return []
            
            user_ids = obj.default_assigned_to
            users = User.objects.filter(id__in=user_ids)
            return [f"{user.first_name} {user.last_name}" for user in users]
        except Exception as e:
            return []

    def create(self, validated_data):
        """Create new settings for the tenant."""
        try:
            if 'tenant' not in validated_data:
                validated_data['tenant'] = self.context['request'].user.tenant
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError(f"Error creating settings: {str(e)}")

    def update(self, instance, validated_data):
        """Update existing settings."""
        try:
            # Ensure default_assigned_to is a list
            if 'default_assigned_to' in validated_data:
                validated_data['default_assigned_to'] = list(validated_data['default_assigned_to'])
            
            return super().update(instance, validated_data)
        except Exception as e:
            raise serializers.ValidationError(f"Error updating settings: {str(e)}")


class FacebookWebhookHistorySerializer(serializers.ModelSerializer):
    """Serializer for the FacebookWebhookHistory model."""
    
    class Meta:
        model = FacebookWebhookHistory
        fields = (
            'id', 'tenant', 'raw_data', 'processed', 'processed_at',
            'lead_created', 'lead_id', 'error', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'processed', 'processed_at', 
                           'lead_created', 'lead_id', 'error')


class FacebookLeadWebhookSerializer(serializers.Serializer):
    """Serializer for processing Facebook lead webhook data."""
    
    tenant_id = serializers.UUIDField()
    lead_data = serializers.DictField()

    def create(self, validated_data):
        tenant_id = validated_data['tenant_id']
        lead_data = validated_data['lead_data']
        
        # Get Facebook settings for the tenant
        try:
            settings = FacebookIntegrationSettings.objects.get(tenant_id=tenant_id)
        except FacebookIntegrationSettings.DoesNotExist:
            return FacebookWebhookHistory.objects.create(
                tenant_id=tenant_id,
                raw_data=lead_data,
                error="Facebook integration settings not found"
            )
        
        # Get admin user for created_by field
        admin_user = User.objects.filter(
            tenant_id=tenant_id,
            is_tenant_owner=True
        ).first() or User.objects.filter(
            tenant_id=tenant_id,
            role='admin'
        ).first()
        
        if not admin_user:
            return FacebookWebhookHistory.objects.create(
                tenant_id=tenant_id,
                raw_data=lead_data,
                error="No admin user found for tenant"
            )
        
        # Get assigned user from default_assigned_to
        assigned_user_id = None
        if settings.default_assigned_to:
            if isinstance(settings.default_assigned_to, list) and settings.default_assigned_to:
                assigned_user_id = settings.default_assigned_to[0]
            elif isinstance(settings.default_assigned_to, (str, int)):
                assigned_user_id = settings.default_assigned_to
        
        # Create webhook history record
        webhook_history = FacebookWebhookHistory.objects.create(
            tenant_id=tenant_id,
            raw_data=lead_data
        )
        
        try:
            # Extract lead data
            form_data = lead_data.get('form_data', {})
            name = form_data.get('full_name', '')
            email = form_data.get('email', '')
            phone = form_data.get('phone_number', '')
            
            # Create lead
            lead = Lead.objects.create(
                tenant_id=tenant_id,
                created_by=admin_user,
                assigned_to_id=assigned_user_id,
                department=settings.default_department,
                lead_type=settings.default_lead_type,
                name=name,
                email=email,
                phone=phone,
                source='facebook',
                last_contacted=timezone.now(),
                notes=json.dumps(lead_data, indent=2)
            )
            
            # Update webhook history
            webhook_history.lead_created = True
            webhook_history.lead_id = lead.id
            webhook_history.save()
            
            return webhook_history
            
        except Exception as e:
            webhook_history.error = str(e)
            webhook_history.save()
            return webhook_history 