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
        ('Economy', 'Economy'),
    ]
    
    STAR_CHOICES = [
        ('5', '5 Star'),
        ('4', '4 Star'),
        ('3', '3 Star'),
        ('2', '2 Star'),
        ('economy', 'Economy'),
        ('sharing', 'Sharing'),
    ]
    
    VISA_CHOICES = [
        ('included', 'Included'),
        ('not_included', 'Not Included'),
    ]
    
    ZIYARAT_CHOICES = [
        ('makkah_medinah', 'Makkah & Medinah'),
        ('not_included', 'Not Included'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='hajj_packages')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_hajj_packages')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_hajj_packages')
    
    # Package Details
    package_name = models.CharField(max_length=255)
    visa = models.CharField(max_length=20, choices=VISA_CHOICES, default='included')
    ziyarat = models.CharField(max_length=20, choices=ZIYARAT_CHOICES, default='makkah_medinah')
    flight_carrier = models.CharField(max_length=255)
    
    # Hajj Details
    package_star = models.CharField(max_length=20, choices=STAR_CHOICES)
    hajj_days = models.PositiveIntegerField()
    departure_date = models.DateField()
    return_date = models.DateField()
    maktab_no = models.CharField(max_length=50, blank=True, null=True)
    
    # Makkah Accommodation Details
    hotel_makkah = models.CharField(max_length=255)
    makkah_star = models.CharField(max_length=20, choices=STAR_CHOICES)
    makkah_check_in = models.DateField(null=True, blank=True)
    makkah_check_out = models.DateField(null=True, blank=True)
    makkah_room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES)
    makkah_nights = models.PositiveIntegerField(default=0)
    
    # Madinah Accommodation Details
    hotel_madinah = models.CharField(max_length=255)
    madinah_star = models.CharField(max_length=20, choices=STAR_CHOICES)
    madinah_check_in = models.DateField(null=True, blank=True)
    madinah_check_out = models.DateField(null=True, blank=True)
    madinah_room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES)
    madinah_nights = models.PositiveIntegerField(default=0)
    
    # Pricing
    total_cost = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    # For storing tags and custom fields
    tags = models.JSONField(null=True, blank=True)
    
    # For storing image path
    image = models.ImageField(upload_to='hajj_packages/', null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['package_name']),
            models.Index(fields=['departure_date']),
            models.Index(fields=['is_active']),
        ]
        
    def __str__(self):
        return self.package_name
