from rest_framework import serializers
from .models import CannedMessage

class CannedMessageSerializer(serializers.ModelSerializer):
    tenant_id = serializers.UUIDField(read_only=True)
    created_by_id = serializers.UUIDField(read_only=True)
    
    class Meta:
        model = CannedMessage
        fields = [
            'id', 'template_name', 'template_message', 'tenant_id', 
            'created_by_id', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant_id', 'created_by_id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        # Convert the instance to a dictionary
        representation = super().to_representation(instance)
        
        # Add tenant_id from the tenant object
        if instance.tenant:
            representation['tenant_id'] = str(instance.tenant.id)
        
        # Add created_by information if available
        if instance.created_by:
            representation['created_by_id'] = str(instance.created_by.id)
            representation['created_by_email'] = instance.created_by.email
            
        return representation
    
    def validate_template_name(self, value):
        """
        Check that the template name is unique per tenant
        """
        # Get the tenant from the context
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            tenant_user = request.user.tenant_users.first()
            if tenant_user:
                # If we're updating an existing instance
                instance = getattr(self, 'instance', None)
                if instance:
                    # Skip validation if the name hasn't changed for this tenant
                    if instance.template_name == value and instance.tenant == tenant_user.tenant:
                        return value
                    
                # Check for existing templates with the same name in this tenant
                if CannedMessage.objects.filter(
                    template_name=value, 
                    tenant=tenant_user.tenant
                ).exists():
                    raise serializers.ValidationError("A template with this name already exists for your tenant.")
        
        return value 