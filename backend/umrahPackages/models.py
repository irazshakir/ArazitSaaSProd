import uuid
from django.db import models
from users.models import User, Tenant

class UmrahPackage(models.Model):
    """Model for Umrah Packages in the CRM system."""
    
    ROOM_TYPE_CHOICES = [
        ('Double', 'Double'),
        ('Triple', 'Triple'),
        ('Quad', 'Quad'),
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
    
    TRANSPORTATION_CHOICES = [
        ('included', 'Included'),
        ('not_included', 'Not Included'),
    ]
    
    VEHICLE_TYPE_CHOICES = [
        ('coaster', 'Coaster'),
        ('bus', 'Bus'),
        ('SUV', 'SUV'),
        ('sedan', 'Sedan'),
        ('van', 'Van'),
        ('ministry_approved_bus', 'Ministry Approved Bus'),
    ]
    
    ZIYARAT_CHOICES = [
        ('makkah_madinah', 'Makkah & Madinah'),
        ('makkah_only', 'Makkah Only'),
        ('madinah_only', 'Madinah Only'),
        ('not_included', 'Not Included'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='umrah_packages')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_umrah_packages')
    
    # Package Details
    package_name = models.CharField(max_length=255)
    visa = models.CharField(max_length=20, choices=VISA_CHOICES, default='included')
    transportation = models.CharField(max_length=20, choices=TRANSPORTATION_CHOICES, default='included')
    vehicle_type = models.CharField(max_length=30, choices=VEHICLE_TYPE_CHOICES, blank=True, null=True)
    flight_carrier = models.CharField(max_length=255, blank=True, null=True)
    ziyarat = models.CharField(max_length=20, choices=ZIYARAT_CHOICES, default='makkah_madinah')
    
    # Umrah Details
    package_star = models.CharField(max_length=20, choices=STAR_CHOICES)
    umrah_days = models.PositiveIntegerField()
    departure_date = models.DateField()
    return_date = models.DateField()
    
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
    image = models.ImageField(upload_to='umrah_packages/', null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['package_name']),
            models.Index(fields=['departure_date']),
            models.Index(fields=['is_active']),
        ]
        
    def __str__(self):
        return self.package_name


class UmrahHotel(models.Model):
    """Model for hotels associated with Umrah Packages."""
    
    CITY_CHOICES = [
        ('Makkah', 'Makkah'),
        ('Madinah', 'Madinah'),
    ]
    
    STAR_CHOICES = [
        ('5', '5 Star'),
        ('4', '4 Star'),
        ('3', '3 Star'),
        ('2', '2 Star'),
        ('economy', 'Economy'),
        ('sharing', 'Sharing'),
    ]
    
    ROOM_TYPE_CHOICES = [
        ('Double', 'Double'),
        ('Triple', 'Triple'),
        ('Quad', 'Quad'),
        ('Penta', 'Penta'),
        ('Hexa', 'Hexa'),
        ('Economy', 'Economy'),
        ('Sharing', 'Sharing'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    umrah_package = models.ForeignKey(UmrahPackage, on_delete=models.CASCADE, related_name='hotels')
    hotel_name = models.CharField(max_length=255)
    hotel_city = models.CharField(max_length=10, choices=CITY_CHOICES)
    checkin_date = models.DateField()
    checkout_date = models.DateField()
    hotel_star = models.CharField(max_length=20, choices=STAR_CHOICES)
    hotel_room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES)
    no_of_nights = models.PositiveIntegerField(default=0)
    buying_cost = models.DecimalField(max_digits=10, decimal_places=2)
    selling_cost = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['hotel_city', 'checkin_date']
        
    def __str__(self):
        return f"{self.hotel_name} - {self.hotel_city}"
