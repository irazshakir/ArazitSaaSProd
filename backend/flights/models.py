from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()

class Flight(models.Model):
    TICKET_STATUS_CHOICES = (
        ('inquiry', 'Inquiry'),
        ('booking', 'Booking'),
        ('issued', 'Issued'),
        ('cancelled', 'Cancelled'),
        ('refund', 'Refund'),
    )
    
    lead_inquiry = models.ForeignKey('leads.Lead', on_delete=models.CASCADE, related_name='flight_inquiries', null=True, blank=True)
    
    travelling_from = models.CharField(max_length=100)
    travelling_to = models.CharField(max_length=100)
    travel_date = models.DateField(null=True, blank=True)
    return_date = models.DateField(null=True, blank=True)
    passengers = models.JSONField(default=dict)  # Format: {"adult": 1, "child": 0, "infant": 0}
    pnr = models.CharField(max_length=20, blank=True)
    ticket_status = models.CharField(max_length=20, choices=TICKET_STATUS_CHOICES, default='inquiry')
    carrier = models.CharField(max_length=100, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_flights', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.travelling_from} to {self.travelling_to} - {self.pnr or 'No PNR'}"
    
    class Meta:
        verbose_name = _('Flight')
        verbose_name_plural = _('Flights')
        ordering = ['-created_at']


class PassengerDetail(models.Model):
    flight_inquiry = models.ForeignKey(Flight, on_delete=models.CASCADE, related_name='passenger_details')
    passenger_fname = models.CharField(max_length=100)
    passenger_lname = models.CharField(max_length=100)
    passport_no = models.CharField(max_length=50, blank=True, null=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.passenger_fname} {self.passenger_lname} - {self.passport_no}"
    
    class Meta:
        verbose_name = _('Passenger Detail')
        verbose_name_plural = _('Passenger Details')
        ordering = ['-created_at']


class CostDetail(models.Model):
    flight_inquiry = models.ForeignKey(Flight, on_delete=models.CASCADE, related_name='cost_details')
    adult_price = models.DecimalField(max_digits=10, decimal_places=2)
    child_price = models.DecimalField(max_digits=10, decimal_places=2)
    infant_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2)
    total_sell = models.DecimalField(max_digits=10, decimal_places=2)
    total_profit = models.DecimalField(max_digits=10, decimal_places=2)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Cost Details for {self.flight_inquiry.pnr}"
    
    class Meta:
        verbose_name = _('Cost Detail')
        verbose_name_plural = _('Cost Details')
        ordering = ['-created_at']
