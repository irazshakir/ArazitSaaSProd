from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum, Q

from .models import Invoice, PaymentHistory
from .serializers import InvoiceSerializer, InvoiceListSerializer, PaymentHistorySerializer


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_number', 'customer_name', 'customer_email', 'lead__name']
    ordering_fields = ['created_at', 'issue_date', 'due_date', 'total_amount', 'paid_amount']
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = Invoice.objects.all().order_by('-created_at')
        
        # Filter by status if provided
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        # Filter by lead if provided
        lead_id = self.request.query_params.get('lead')
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)
            
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        invoice = self.get_object()
        payments = PaymentHistory.objects.filter(invoice=invoice)
        serializer = PaymentHistorySerializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get invoice statistics"""
        total_invoices = Invoice.objects.count()
        total_amount = Invoice.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        paid_amount = Invoice.objects.aggregate(total=Sum('paid_amount'))['total'] or 0
        
        paid_invoices = Invoice.objects.filter(status='PAID').count()
        partially_paid = Invoice.objects.filter(status='PARTIALLY_PAID').count()
        no_payment = Invoice.objects.filter(status='NO_PAYMENT').count()
        
        return Response({
            'total_invoices': total_invoices,
            'total_amount': total_amount,
            'paid_amount': paid_amount,
            'outstanding_amount': total_amount - paid_amount,
            'paid_invoices': paid_invoices,
            'partially_paid_invoices': partially_paid,
            'no_payment_invoices': no_payment,
        })
    
    @action(detail=False, methods=['get'])
    def by_lead(self, request):
        """Get invoices for a specific lead"""
        lead_id = request.query_params.get('lead_id')
        if not lead_id:
            return Response({"error": "lead_id parameter is required"}, status=400)
            
        invoices = Invoice.objects.filter(lead_id=lead_id).order_by('-created_at')
        serializer = InvoiceListSerializer(invoices, many=True)
        return Response(serializer.data)


class PaymentHistoryViewSet(viewsets.ModelViewSet):
    queryset = PaymentHistory.objects.all().order_by('-payment_date')
    serializer_class = PaymentHistorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['transaction_id', 'invoice__invoice_number', 'invoice__lead__name']
    ordering_fields = ['payment_date', 'amount']
    
    def get_queryset(self):
        queryset = PaymentHistory.objects.all().order_by('-payment_date')
        
        # Filter by invoice if provided
        invoice_id = self.request.query_params.get('invoice')
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)
            
        # Filter by payment_method if provided
        payment_method = self.request.query_params.get('payment_method')
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
            
        # Filter by lead if provided
        lead_id = self.request.query_params.get('invoice__lead')
        if lead_id:
            queryset = queryset.filter(invoice__lead_id=lead_id)
            
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
