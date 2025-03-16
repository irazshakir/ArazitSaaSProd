from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from django.utils import timezone

from users.models import User
from .models import (
    Lead, LeadActivity, LeadNote, LeadDocument, 
    LeadEvent, LeadProfile, LeadOverdue
)
from .serializers import (
    LeadSerializer, LeadListSerializer, LeadActivitySerializer,
    LeadNoteSerializer, LeadDocumentSerializer, LeadEventSerializer,
    LeadProfileSerializer, LeadOverdueSerializer
)

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
    search_fields = ['name', 'email', 'phone', 'whatsapp']
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
            
            # Create a note for the assignment
            LeadNote.objects.create(
                lead=lead,
                tenant=lead.tenant,
                added_by=request.user,
                note=f"Lead assigned to {user.get_full_name() or user.email}"
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
        
        # Create a note for the status change
        LeadNote.objects.create(
            lead=lead,
            tenant=lead.tenant,
            added_by=request.user,
            note=f"Status changed from {old_status} to {lead.get_status_display()}"
        )
        
        # Create appropriate lead event
        if status_value == Lead.STATUS_WON:
            LeadEvent.objects.create(
                lead=lead,
                tenant=lead.tenant,
                event_type=LeadEvent.EVENT_WON,
                updated_by=request.user
            )
        elif status_value == Lead.STATUS_LOST:
            LeadEvent.objects.create(
                lead=lead,
                tenant=lead.tenant,
                event_type=LeadEvent.EVENT_LOST,
                updated_by=request.user
            )
        elif status_value == Lead.STATUS_NON_POTENTIAL:
            LeadEvent.objects.create(
                lead=lead,
                tenant=lead.tenant,
                event_type=LeadEvent.EVENT_CLOSED,
                updated_by=request.user
            )
        
        serializer = self.get_serializer(lead)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add a note to a lead."""
        lead = self.get_object()
        
        serializer = LeadNoteSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save(lead=lead, tenant=lead.tenant)
            
            # Update last_contacted
            lead.last_contacted = timezone.now()
            lead.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_activity(self, request, pk=None):
        """Add an activity to a lead."""
        lead = self.get_object()
        
        serializer = LeadActivitySerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save(lead=lead, tenant=lead.tenant)
            
            # Update last_contacted for any activity
            lead.last_contacted = timezone.now()
            lead.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def upload_document(self, request, pk=None):
        """Upload a document for a lead."""
        lead = self.get_object()
        
        serializer = LeadDocumentSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save(lead=lead, tenant=lead.tenant)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def update_profile(self, request, pk=None):
        """Update or create lead profile."""
        lead = self.get_object()
        
        # Try to get existing profile
        try:
            profile = LeadProfile.objects.get(lead=lead)
            serializer = LeadProfileSerializer(
                profile,
                data=request.data,
                partial=True,
                context={'request': request}
            )
        except LeadProfile.DoesNotExist:
            serializer = LeadProfileSerializer(
                data=request.data,
                context={'request': request}
            )
        
        if serializer.is_valid():
            serializer.save(lead=lead, tenant=lead.tenant)
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def mark_overdue(self, request, pk=None):
        """Mark a lead as overdue."""
        lead = self.get_object()
        
        # Check if already marked as overdue
        existing = LeadOverdue.objects.filter(lead=lead, overdue=True).first()
        if existing:
            return Response(
                {"error": "Lead is already marked as overdue"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create overdue record
        overdue = LeadOverdue.objects.create(
            lead=lead,
            tenant=lead.tenant,
            lead_user=lead.assigned_to
        )
        
        serializer = LeadOverdueSerializer(overdue)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def resolve_overdue(self, request, pk=None):
        """Resolve an overdue lead."""
        lead = self.get_object()
        
        # Find active overdue record
        overdue = LeadOverdue.objects.filter(lead=lead, overdue=True).first()
        if not overdue:
            return Response(
                {"error": "No active overdue record found for this lead"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Resolve it
        overdue.resolve()
        
        serializer = LeadOverdueSerializer(overdue)
        return Response(serializer.data)
    
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
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get all overdue leads."""
        user = request.user
        tenant_ids = user.tenant_users.values_list('tenant', flat=True)
        
        # Get leads with active overdue records
        overdue_lead_ids = LeadOverdue.objects.filter(
            tenant__in=tenant_ids,
            overdue=True
        ).values_list('lead', flat=True)
        
        leads = self.get_queryset().filter(id__in=overdue_lead_ids)
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
        This view should return activities for leads in the user's tenant,
        filtered by lead ID if provided.
        """
        user = self.request.user
        tenant_ids = user.tenant_users.values_list('tenant', flat=True)
        queryset = LeadActivity.objects.filter(tenant__in=tenant_ids)
        
        # Filter by lead ID if provided in query params
        lead_id = self.request.query_params.get('lead')
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)
            
        return queryset.order_by('-created_at')  # Most recent first
    
    def perform_create(self, serializer):
        """Set the user to the current user."""
        serializer.save(user=self.request.user)


class LeadNoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for LeadNote model.
    Provides CRUD operations for Lead Notes.
    """
    queryset = LeadNote.objects.all()
    serializer_class = LeadNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        This view should return notes for leads in the user's tenant.
        """
        user = self.request.user
        tenant_ids = user.tenant_users.values_list('tenant', flat=True)
        return LeadNote.objects.filter(tenant__in=tenant_ids)
    
    def perform_create(self, serializer):
        """Set the added_by to the current user."""
        serializer.save(added_by=self.request.user)


class LeadDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for LeadDocument model.
    Provides CRUD operations for Lead Documents.
    """
    queryset = LeadDocument.objects.all()
    serializer_class = LeadDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        This view should return documents for leads in the user's tenant.
        Also filter by lead ID if provided in query params.
        """
        user = self.request.user
        tenant_ids = user.tenant_users.values_list('tenant', flat=True)
        queryset = LeadDocument.objects.filter(tenant__in=tenant_ids)
        
        # Filter by lead ID if provided
        lead_id = self.request.query_params.get('lead')
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)
            
        return queryset
    
    def perform_create(self, serializer):
        """Set the uploaded_by to the current user."""
        serializer.save(uploaded_by=self.request.user)


class LeadEventViewSet(viewsets.ModelViewSet):
    """
    ViewSet for LeadEvent model.
    Provides CRUD operations for Lead Events.
    """
    queryset = LeadEvent.objects.all()
    serializer_class = LeadEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        This view should return events for leads in the user's tenant.
        """
        user = self.request.user
        tenant_ids = user.tenant_users.values_list('tenant', flat=True)
        return LeadEvent.objects.filter(tenant__in=tenant_ids)
    
    def perform_create(self, serializer):
        """Set the updated_by to the current user."""
        serializer.save(updated_by=self.request.user)


class LeadProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for LeadProfile model.
    Provides CRUD operations for Lead Profiles.
    """
    queryset = LeadProfile.objects.all()
    serializer_class = LeadProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        This view should return profiles for leads in the user's tenant.
        """
        user = self.request.user
        tenant_ids = user.tenant_users.values_list('tenant', flat=True)
        return LeadProfile.objects.filter(tenant__in=tenant_ids)


class LeadOverdueViewSet(viewsets.ModelViewSet):
    """
    ViewSet for LeadOverdue model.
    Provides CRUD operations for Lead Overdue records.
    """
    queryset = LeadOverdue.objects.all()
    serializer_class = LeadOverdueSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        This view should return overdue records for leads in the user's tenant.
        """
        user = self.request.user
        tenant_ids = user.tenant_users.values_list('tenant', flat=True)
        return LeadOverdue.objects.filter(tenant__in=tenant_ids)
