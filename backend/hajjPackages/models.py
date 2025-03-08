import uuid
from django.db import models
from users.models import User, Tenant

class HajjPackage(models.Model):
    """Model for Hajj Packages in the CRM system."""
    
    ROOM_TYPE_CHOICES = [
        ('Double', 'Double'),
        ('Triple', 'Triple'),
        ('Quad', 'Quad'),
        ('Penta', 'Penta'),
        ('Hexa', 'Hexa'),
        ('Sharing', 'Sharing'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='hajj_packages')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_hajj_packages')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_hajj_packages')
    
    # Package Details
    package_name = models.CharField(max_length=255)
    hujjaj = models.JSONField(help_text="JSON object storing number of adults, children, infants")
    hajj_days = models.PositiveIntegerField()
    hajj_star = models.PositiveIntegerField(help_text="Star rating of the Hajj package")
    hajj_start_date = models.DateField()
    hajj_end_date = models.DateField()
    
    # Accommodation Details
    hotel_makkah = models.CharField(max_length=255)
    hotel_medina = models.CharField(max_length=255)
    maktab_no = models.CharField(max_length=50, blank=True, null=True)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES)
    
    # Transportation Details
    flight = models.CharField(max_length=255)
    flight_carrier = models.CharField(max_length=255)
    visa = models.CharField(max_length=255)
    
    # Pricing
    buying_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['hajj_start_date']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.package_name} - {self.tenant.name}"
