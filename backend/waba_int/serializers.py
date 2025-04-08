from rest_framework import serializers
from .models import Chat, Message, WABASettings
from django.contrib.auth.hashers import make_password

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'message_id', 'sender', 'content', 'timestamp']

class ChatSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Chat
        fields = ['id', 'chat_id', 'customer_name', 'created_at', 'updated_at', 'messages']

class WABASettingsSerializer(serializers.ModelSerializer):
    # Add a write-only field for password to ensure secure handling
    password = serializers.CharField(write_only=True, required=False)
    tenant_id = serializers.UUIDField(read_only=True)
    
    class Meta:
        model = WABASettings
        fields = [
            'id', 'tenant', 'tenant_id', 'api_url', 'email', 'password', 'is_active',
            'api_key', 'api_secret', 'phone_number_id', 'business_account_id',
            'webhook_verify_token', 'webhook_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'tenant_id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        # Convert the instance to a dictionary
        representation = super().to_representation(instance)
        
        # Add tenant_id from the tenant object
        if instance.tenant:
            representation['tenant_id'] = str(instance.tenant.id)
        
        # Remove the password field from the response
        if 'password' in representation:
            del representation['password']
            
        return representation
    
    def create(self, validated_data):
        # Store the password in plain text for the OnCloudAPIClient to use
        # We're not hashing the password because the OnCloudAPIClient needs the plain text password
        print(f"[DEBUG] WABASettingsSerializer - Creating new settings with password length: {len(validated_data['password']) if 'password' in validated_data else 0}")
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Store the password in plain text for the OnCloudAPIClient to use
        # We're not hashing the password because the OnCloudAPIClient needs the plain text password
        print(f"[DEBUG] WABASettingsSerializer - Updating settings with password length: {len(validated_data['password']) if 'password' in validated_data else 0}")
        return super().update(instance, validated_data)