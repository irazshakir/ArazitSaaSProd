from rest_framework import serializers
from .models import Invoice, PaymentHistory
from leads.models import Lead


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ['id', 'name', 'email', 'phone']


class PaymentHistorySerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.ReadOnlyField(source='recorded_by.full_name')
    
    class Meta:
        model = PaymentHistory
        fields = [
            'id', 'invoice', 'amount', 'payment_date', 'payment_method',
            'transaction_id', 'notes', 'recorded_by', 'recorded_by_name', 'created_at'
        ]
        read_only_fields = ['recorded_by', 'recorded_by_name']


class InvoiceSerializer(serializers.ModelSerializer):
    payments = PaymentHistorySerializer(many=True, read_only=True)
    created_by_name = serializers.ReadOnlyField(source='created_by.full_name')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    lead_details = LeadSerializer(source='lead', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer_name', 'customer_email', 'customer_phone',
            'lead', 'lead_details', 'issue_date', 'due_date', 'total_amount', 'paid_amount', 
            'status', 'status_display', 'notes', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'payments'
        ]
        read_only_fields = ['created_by', 'created_by_name', 'paid_amount', 'status', 'lead_details']


class InvoiceListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.full_name')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    lead_name = serializers.ReadOnlyField(source='lead.name')
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer_name', 'lead', 'lead_name', 'issue_date', 
            'due_date', 'total_amount', 'paid_amount', 'status', 'status_display',
            'created_by_name', 'created_at'
        ] 