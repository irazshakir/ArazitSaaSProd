from django.db import models
from users.models import Tenant
from django.core.validators import MinValueValidator, MaxValueValidator

class WABASettings(models.Model):
    """Model to store WhatsApp Business API settings per tenant"""
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='waba_settings')
    api_url = models.URLField(default='https://apps.oncloudapi.com')
    email = models.EmailField()
    password = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    api_key = models.CharField(max_length=255, null=True, blank=True)
    api_secret = models.CharField(max_length=255, null=True, blank=True)
    phone_number_id = models.CharField(max_length=255, null=True, blank=True)
    business_account_id = models.CharField(max_length=255, null=True, blank=True)
    webhook_verify_token = models.CharField(max_length=255, null=True, blank=True)
    webhook_url = models.URLField(null=True, blank=True)

    class Meta:
        verbose_name = 'WABA Settings'
        verbose_name_plural = 'WABA Settings'
        db_table = 'waba_settings'

    def __str__(self):
        return f"WABA Settings for {self.tenant.name}"

    @property
    def is_configured(self):
        """Check if all required fields are set"""
        required_fields = [
            self.api_key,
            self.api_secret,
            self.phone_number_id,
            self.business_account_id,
            self.webhook_verify_token,
            self.webhook_url
        ]
        return all(required_fields)

class Chat(models.Model):
    """Model to store WhatsApp chat contacts with tenant support"""
    contact_id = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    name = models.CharField(max_length=255, blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)
    last_message = models.TextField(blank=True, null=True)
    last_message_time = models.DateTimeField(blank=True, null=True)
    
    # Reference to the CRM lead
    lead_id = models.UUIDField(blank=True, null=True, help_text="UUID of associated lead")
    
    # Multi-tenant support
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='whatsapp_chats')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_message_time']
        # Create a unique constraint for contact_id + tenant to ensure
        # the same contact can exist for different tenants
        unique_together = ['contact_id', 'tenant']
        indexes = [
            models.Index(fields=['contact_id']),
            models.Index(fields=['phone']),
            models.Index(fields=['lead_id']),
        ]

    def __str__(self):
        return f"{self.name or 'Unknown'} ({self.phone}) - Tenant: {self.tenant.name}"

class Message(models.Model):
    """Model to store WhatsApp messages with tenant support"""
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    message_id = models.CharField(max_length=255)
    text = models.TextField(blank=True, null=True)
    sent_by_contact = models.BooleanField(default=True)
    timestamp = models.DateTimeField()
    is_image = models.BooleanField(default=False)
    image_url = models.URLField(blank=True, null=True)
    
    # Multi-tenant support - redundant but useful for direct queries
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='whatsapp_messages')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['timestamp']
        # Create a unique constraint for message_id + tenant
        unique_together = ['message_id', 'tenant']
        indexes = [
            models.Index(fields=['message_id']),
            models.Index(fields=['-timestamp']),  # Index for newest messages
        ]
    
    def __str__(self):
        direction = "From contact" if self.sent_by_contact else "To contact"
        return f"{direction}: {self.chat.name or self.chat.phone} ({self.timestamp})"
