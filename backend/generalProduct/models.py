from django.db import models
import uuid

class GeneralProduct(models.Model):
    """Model for general products across tenants."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='general_products')
    productName = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.productName} ({self.tenant.name})"
    
    class Meta:
        ordering = ['-created_at'] 