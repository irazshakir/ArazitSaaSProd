import uuid
from django.db import models
from users.models import Tenant


class FacebookIntegrationSettings(models.Model):
    """Model to store Facebook integration settings for each tenant."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='facebook_settings')
    
    # Integration status
    is_active = models.BooleanField(default=False, help_text="Whether the Facebook integration is active")
    
    # Albato integration settings
    albato_integration_id = models.CharField(max_length=255, blank=True, null=True, 
                                           help_text="Integration ID from Albato")
    
    # Webhook security (if needed)
    webhook_secret = models.CharField(max_length=255, blank=True, null=True,
                                    help_text="Secret key for webhook verification")
    
    # Default lead settings - Changed to JSONB for multiple users
    default_assigned_to = models.JSONField(null=True, blank=True,
                                         help_text="List of user IDs for round-robin lead assignment")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Facebook Integration Settings"
        verbose_name_plural = "Facebook Integration Settings"
    
    def __str__(self):
        return f"Facebook Integration - {self.tenant.name}"
    
    def get_webhook_url(self):
        """Generate the webhook URL for this tenant."""
        return f"https://api.arazit.com/api/webhook/facebook/{self.tenant.id}/"


class FacebookWebhookHistory(models.Model):
    """Model to store incoming webhook data from Facebook via Albato integration."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='fb_webhook_history')
    
    # Webhook data
    raw_data = models.JSONField(help_text="Raw data received from the webhook")
    processed = models.BooleanField(default=False, help_text="Whether this webhook data has been processed")
    processed_at = models.DateTimeField(null=True, blank=True, help_text="When this webhook data was processed")
    
    # Lead reference if created
    lead_created = models.BooleanField(default=False, help_text="Whether a lead was created from this webhook")
    lead_id = models.UUIDField(null=True, blank=True, help_text="ID of the lead created from this webhook")
    
    # Error handling
    error = models.TextField(null=True, blank=True, help_text="Error message if processing failed")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['processed']),
            models.Index(fields=['lead_created']),
        ]
        verbose_name_plural = "Facebook webhook histories"
    
    def __str__(self):
        return f"FB Webhook {self.id} - Tenant: {self.tenant.name} - Processed: {self.processed}" 