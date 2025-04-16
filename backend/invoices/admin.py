from django.contrib import admin
from .models import Invoice, PaymentHistory


class PaymentHistoryInline(admin.TabularInline):
    model = PaymentHistory
    extra = 0
    readonly_fields = ['created_at']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'customer_name', 'lead', 'issue_date', 'due_date', 
                   'total_amount', 'paid_amount', 'status', 'created_at']
    list_filter = ['status', 'issue_date', 'due_date']
    search_fields = ['invoice_number', 'customer_name', 'customer_email', 'lead__name']
    readonly_fields = ['paid_amount', 'status', 'created_at', 'updated_at']
    inlines = [PaymentHistoryInline]


@admin.register(PaymentHistory)
class PaymentHistoryAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'amount', 'payment_date', 'payment_method', 
                   'transaction_id', 'recorded_by', 'created_at']
    list_filter = ['payment_date', 'payment_method']
    search_fields = ['invoice__invoice_number', 'transaction_id', 'invoice__lead__name']
    readonly_fields = ['created_at']
