from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone

from users.models import User
from .models import Lead, LeadActivity
from .serializers import LeadSerializer, LeadListSerializer, LeadActivitySerializer

# Create your views here.

class LeadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Lead model.
    Provides CRUD operations for Leads.
    """
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email', 'phone', 'company']
    ordering_fields = ['created_at', 'updated_at', 'last_contacted', 'next_follow_up', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        This view should return a list of all the leads
        for the currently authenticated user's tenant.
        """
        user = self.request.user
        return Lead.objects.filter(tenant__in=user.tenant_users.values_list('tenant', flat=True))
    
    def get_serializer_class(self):
        """
        Return appropriate serializer class based on action.
        """
        if self.action == 'list':
            return LeadListSerializer
        return self.serializer_class
    
    def perform_create(self, serializer):
        """Set the tenant based on the user's primary tenant."""
        user = self.request.user
        # Get the user's tenant where they are the owner or first active tenant
        tenant_user = user.tenant_users.filter(Q(role='owner') | Q(tenant__is_active=True)).first()
        
        if not tenant_user:
            raise ValidationError("User does not belong to any tenant")
            
        serializer.save(tenant=tenant_user.tenant)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign a lead to a user."""
        lead = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {"error": "User ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Check if the user belongs to the same tenant
            user = User.objects.get(
                id=user_id, 
                tenant_users__tenant=lead.tenant
            )
            
            lead.assigned_to = user
            lead.save()
            
            # Create an activity record for the assignment
            LeadActivity.objects.create(
                lead=lead,
                user=request.user,
                activity_type=LeadActivity.TYPE_NOTE,
                description=f"Lead assigned to {user.first_name} {user.last_name}"
            )
            
            serializer = self.get_serializer(lead)
            return Response(serializer.data)
            
        except User.DoesNotExist:
            return Response(
                {"error": "User not found or does not belong to the same tenant"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update the status of a lead."""
        lead = self.get_object()
        status_value = request.data.get('status')
        
        if not status_value:
            return Response(
                {"error": "Status is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if status_value not in dict(Lead.STATUS_CHOICES):
            return Response(
                {"error": "Invalid status value"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = lead.get_status_display()
        lead.status = status_value
        lead.save()
        
        # Create an activity record for the status change
        LeadActivity.objects.create(
            lead=lead,
            user=request.user,
            activity_type=LeadActivity.TYPE_NOTE,
            description=f"Status changed from {old_status} to {lead.get_status_display()}"
        )
        
        serializer = self.get_serializer(lead)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_activity(self, request, pk=None):
        """Add an activity to a lead."""
        lead = self.get_object()
        
        # Create a serializer with the lead already set
        serializer = LeadActivitySerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save(lead=lead)
            
            # If this is a contact activity, update last_contacted
            activity_type = serializer.validated_data.get('activity_type')
            if activity_type in [LeadActivity.TYPE_CALL, LeadActivity.TYPE_EMAIL, LeadActivity.TYPE_MEETING]:
                lead.last_contacted = timezone.now()
                lead.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get leads filtered by lead_type."""
        lead_type = request.query_params.get('type')
        
        if not lead_type:
            return Response(
                {"error": "Lead type parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leads = self.get_queryset().filter(lead_type=lead_type)
        page = self.paginate_queryset(leads)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(leads, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """Get leads filtered by status."""
        status_value = request.query_params.get('status')
        
        if not status_value:
            return Response(
                {"error": "Status parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leads = self.get_queryset().filter(status=status_value)
        page = self.paginate_queryset(leads)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(leads, many=True)
        return Response(serializer.data)


class LeadActivityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for LeadActivity model.
    Provides CRUD operations for Lead Activities.
    """
    queryset = LeadActivity.objects.all()
    serializer_class = LeadActivitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        This view should return activities for leads in the user's tenant.
        """
        user = self.request.user
        tenant_ids = user.tenant_users.values_list('tenant', flat=True)
        return LeadActivity.objects.filter(lead__tenant__in=tenant_ids)
    
    def perform_create(self, serializer):
        """Set the user to the current user."""
        serializer.save(user=self.request.user)
