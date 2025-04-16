from django.db import models
from users.models import Tenant, User
import uuid

class CannedMessage(models.Model):
    """Model to store template canned messages with support for rich text"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template_name = models.CharField(max_length=100, help_text="Name of the message template")
    template_message = models.TextField(help_text="Message template with support for emoji and formatting")
    
    # Multi-tenant support
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='canned_messages')
    
    # User who created the template
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_canned_messages')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['template_name']
        # Create a unique constraint for template_name + tenant to ensure
        # unique template names per tenant
        unique_together = ['template_name', 'tenant']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['is_active']),
        ]
        verbose_name = 'Canned Message'
        verbose_name_plural = 'Canned Messages'
    
    def __str__(self):
        return f"{self.template_name} - {self.tenant.name}"
