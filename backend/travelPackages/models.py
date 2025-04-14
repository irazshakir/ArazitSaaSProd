from django.db import models

class TravelPackage(models.Model):
    PACKAGE_TYPES = [
        ('LOCAL', 'Local'),
        ('INTERNATIONAL', 'International'),
    ]
    
    packageName = models.CharField(max_length=255)
    packageType = models.CharField(max_length=20, choices=PACKAGE_TYPES)
    place = models.JSONField(null=True, blank=True)  # Using the new JSONField
    travel_date = models.DateField(null=True, blank=True)
    return_date = models.DateField(null=True, blank=True)
    is_hotel = models.BooleanField(default=False)
    is_flight = models.BooleanField(default=False)
    is_transfers = models.BooleanField(default=False)
    package_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    package_selling_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)  # For storing additional notes
    image = models.ImageField(upload_to='travel_packages/', blank=True, null=True)  # For storing package images
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.packageName

    class Meta:
        verbose_name = 'Travel Package'
        verbose_name_plural = 'Travel Packages'

class TravelHotel(models.Model):
    HOTEL_STARS = [
        ('5', '5 Star'),
        ('4', '4 Star'),
        ('3', '3 Star'),
        ('ECONOMY', 'Economy'),
    ]
    
    ROOM_TYPES = [
        ('PENTA', 'Penta'),
        ('QUAD', 'Quad'),
        ('TRIPLE', 'Triple'),
        ('DOUBLE', 'Double'),
        ('SHARING', 'Sharing'),
    ]
    
    hotelName = models.CharField(max_length=255, null=True, blank=True)
    hotelPlace = models.CharField(max_length=255, null=True, blank=True)
    checkin_date = models.DateField(null=True, blank=True)
    checkout_date = models.DateField(null=True, blank=True)
    hotelStar = models.CharField(max_length=10, choices=HOTEL_STARS, null=True, blank=True)
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES, null=True, blank=True)
    hotel_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    hotel_selling_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.hotelName} - {self.hotelPlace}"

class TravelFlight(models.Model):
    flight_carrier = models.CharField(max_length=255, null=True, blank=True)
    travel_from = models.CharField(max_length=255, null=True, blank=True)
    travel_to = models.CharField(max_length=255, null=True, blank=True)
    travel_date = models.DateField(null=True, blank=True)
    return_date = models.DateField(null=True, blank=True)
    flight_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    flight_selling_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.flight_carrier} - {self.travel_from} to {self.travel_to}"

class TravelTransfer(models.Model):
    TRANSFER_TYPES = [
        ('BUS', 'Bus'),
        ('COASTER', 'Coaster'),
        ('HIACE', 'Hiace'),
        ('SEDAN', 'Sedan'),
    ]
    
    transfer_type = models.CharField(max_length=10, choices=TRANSFER_TYPES, null=True, blank=True)
    transferPlace = models.CharField(max_length=255, null=True, blank=True)
    transfer_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    transfer_selling_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.transfer_type} - {self.transferPlace}"
