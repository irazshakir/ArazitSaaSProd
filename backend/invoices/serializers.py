from rest_framework import serializers
from .models import Invoice, PaymentHistory
from leads.models import Lead
from users.models import Tenant


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ['id', 'name', 'email', 'phone']


class PaymentHistorySerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.ReadOnlyField(source='recorded_by.full_name')
    
    class Meta:
        model = PaymentHistory
        fields = [
            'id', 'invoice', 'tenant', 'amount', 'payment_date', 'payment_method',
            'transaction_id', 'notes', 'recorded_by', 'recorded_by_name', 'created_at'
        ]
        read_only_fields = ['recorded_by', 'recorded_by_name', 'tenant']
        
    def create(self, validated_data):
        # Set the tenant from the context or the invoice's tenant
        if 'invoice' in validated_data and not 'tenant' in validated_data:
            validated_data['tenant'] = validated_data['invoice'].tenant
        return super().create(validated_data)


class InvoiceSerializer(serializers.ModelSerializer):
    payments = PaymentHistorySerializer(many=True, read_only=True)
    created_by_name = serializers.ReadOnlyField(source='created_by.full_name')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    lead_details = LeadSerializer(source='lead', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer_name', 'customer_email', 'customer_phone',
            'lead', 'lead_details', 'tenant', 'issue_date', 'due_date', 'total_amount', 'paid_amount', 
            'status', 'status_display', 'notes', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'payments'
        ]
        read_only_fields = ['created_by', 'created_by_name', 'paid_amount', 'status', 'lead_details', 'tenant']
        
    def create(self, validated_data):
        # Get the tenant from the context
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            # Get tenant_id from the user's active tenant
            tenant_ids = request.user.tenant_users.values_list('tenant', flat=True)
            if tenant_ids:
                # If there are multiple tenants, use the one from the request or default to first
                tenant_id = (
                    request.query_params.get('tenant_id') or 
                    request.headers.get('X-Tenant-ID') or
                    request.COOKIES.get('tenant_id') or
                    tenant_ids[0]
                )
                from users.models import Tenant
                validated_data['tenant'] = Tenant.objects.get(id=tenant_id)
        return super().create(validated_data)


class InvoiceListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.full_name')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    lead_name = serializers.ReadOnlyField(source='lead.name')
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer_name', 'lead', 'lead_name', 'tenant', 'issue_date', 
            'due_date', 'total_amount', 'paid_amount', 'status', 'status_display',
            'created_by_name', 'created_at'
        ] 