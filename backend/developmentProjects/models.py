from django.db import models
import uuid

class DevelopmentProject(models.Model):
    """Model for real estate development projects"""
    
    # Property type choices
    RESIDENTIAL = 'residential'
    COMMERCIAL = 'commercial'
    
    PROPERTY_TYPE_CHOICES = [
        (RESIDENTIAL, 'Residential'),
        (COMMERCIAL, 'Commercial'),
    ]
    
    # Listing type choices
    HOUSE = 'house'
    FLAT = 'flat'
    SHOP = 'shop'
    BUILDING = 'building'
    FARMHOUSE = 'farmhouse'
    PLOT = 'plot'
    
    LISTING_TYPE_CHOICES = [
        (HOUSE, 'House'),
        (FLAT, 'Flat'),
        (SHOP, 'Shop'),
        (BUILDING, 'Building'),
        (FARMHOUSE, 'Farmhouse'),
        (PLOT, 'Plot'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField(help_text="ID of the tenant account")
    project_name = models.CharField(max_length=255)
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES)
    listing_type = models.CharField(max_length=20, choices=LISTING_TYPE_CHOICES)
    location = models.CharField(max_length=255)
    covered_size = models.CharField(max_length=100, help_text="Size of the property (e.g., '1500 sq ft')")
    features = models.TextField(blank=True, null=True)
    project_image = models.ImageField(upload_to='development_projects/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.project_name} - {self.get_listing_type_display()}"
