from django.db import models
from django.utils import timezone
from users.models import User
from leads.models import Lead


class InvoiceStatusChoices(models.TextChoices):
    PAID = 'PAID', 'Paid'
    PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
    NO_PAYMENT = 'NO_PAYMENT', 'No Payment Yet'


class Invoice(models.Model):
    invoice_number = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField(blank=True, null=True)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20,
        choices=InvoiceStatusChoices.choices,
        default=InvoiceStatusChoices.NO_PAYMENT
    )
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_invoices')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Update status based on payment amount
        if self.paid_amount >= self.total_amount:
            self.status = InvoiceStatusChoices.PAID
        elif self.paid_amount > 0:
            self.status = InvoiceStatusChoices.PARTIALLY_PAID
        else:
            self.status = InvoiceStatusChoices.NO_PAYMENT
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Invoice #{self.invoice_number} - {self.customer_name}"


class PaymentHistory(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(default=timezone.now)
    payment_method = models.CharField(max_length=50)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    recorded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recorded_payments')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update the invoice's paid amount and status
        invoice = self.invoice
        total_payments = invoice.payments.aggregate(total=models.Sum('amount'))['total'] or 0
        invoice.paid_amount = total_payments
        invoice.save()  # This will also update the status
    
    def __str__(self):
        return f"Payment of {self.amount} for Invoice #{self.invoice.invoice_number}"
