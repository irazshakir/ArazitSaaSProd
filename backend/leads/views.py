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
from teams.models import TeamManager, TeamLead, TeamMember

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
        for the currently authenticated user based on their role and team hierarchy.
        """
        user = self.request.user
        tenant_ids = user.tenant_users.values_list('tenant', flat=True)
        queryset = Lead.objects.filter(tenant__in=tenant_ids)
        
        # Apply role-based filtering
        if user.role == 'admin':
            # Admin sees all leads in the tenant
            pass  # No additional filtering needed
            
        elif user.role == 'department_head':
            # Department head sees all leads in their department
            if user.department_id:
                queryset = queryset.filter(department_id=user.department_id)
            else:
                # Log warning about missing department
                print(f"WARNING: Department head user {user.id} has no department_id")
            
        elif user.role == 'manager':
            # Manager sees leads for their teams
            # First, find teams they manage
            managed_teams = TeamManager.objects.filter(manager=user).values_list('team_id', flat=True)
            
            # Find team leads under those teams
            team_leads = TeamLead.objects.filter(team_id__in=managed_teams).values_list('team_lead_id', flat=True)
            
            # Find team members under those team leads
            team_members = TeamMember.objects.filter(team_lead__team_lead_id__in=team_leads).values_list('member_id', flat=True)
            
            # Return leads assigned to any of these users (or the manager themselves)
            queryset = queryset.filter(
                Q(assigned_to=user) | 
                Q(assigned_to_id__in=team_leads) |
                Q(assigned_to_id__in=team_members)
            )
            
        elif user.role == 'team_lead':
            # Team lead sees leads for their team members
            team_members = TeamMember.objects.filter(team_lead__team_lead=user).values_list('member_id', flat=True)
            
            # Return leads assigned to any of these members (or the team lead themselves)
            queryset = queryset.filter(
                Q(assigned_to=user) | 
                Q(assigned_to_id__in=team_members)
            )
            
        else:
            # Regular users (sales_agent, support_agent, processor) see only their assigned leads
            queryset = queryset.filter(assigned_to=user)
        
        return queryset
    
    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        
        # Handle department filtering
        department_id = self.request.query_params.get('department')
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        
        # Handle multiple assigned_to filtering
        assigned_to_in = self.request.query_params.get('assigned_to__in')
        if assigned_to_in:
            user_ids = assigned_to_in.split(',')
            queryset = queryset.filter(assigned_to_id__in=user_ids)
            
        # Handle team filtering
        team_in = self.request.query_params.get('team__in')
        if team_in:
            team_ids = team_in.split(',')
            # Get all users in these teams
            team_user_ids = set()
            
            # Get managers
            managers = TeamManager.objects.filter(team_id__in=team_ids).values_list('manager_id', flat=True)
            team_user_ids.update(managers)
            
            # Get team leads
            team_leads = TeamLead.objects.filter(team_id__in=team_ids).values_list('team_lead_id', flat=True)
            team_user_ids.update(team_leads)
            
            # Get team members
            team_members = TeamMember.objects.filter(team_id__in=team_ids).values_list('member_id', flat=True)
            team_user_ids.update(team_members)
            
            queryset = queryset.filter(assigned_to_id__in=team_user_ids)
            
        return queryset
    
    def get_serializer_class(self):
        """
        Return appropriate serializer class based on action.
        """
        if self.action == 'list':
            return LeadListSerializer
        return self.serializer_class
    
    def perform_create(self, serializer):
        """Set the tenant and department based on the user."""
        user = self.request.user
        tenant_user = user.tenant_users.filter(Q(role='owner') | Q(tenant__is_active=True)).first()
        
        if not tenant_user:
            raise ValidationError("User does not belong to any tenant")
            
        # Get the assigned_to user from request data
        assigned_to_id = self.request.data.get('assigned_to')
        department = None
        
        # If assigned_to is provided, use that user's department
        if assigned_to_id:
            try:
                assigned_user = User.objects.get(id=assigned_to_id)
                department = assigned_user.department
            except User.DoesNotExist:
                # If assigned user doesn't exist, don't set department
                pass
        else:
            # If no assigned_to, use the current user's department
            department = user.department
        
        serializer.save(
            tenant=tenant_user.tenant,
            department=department
        )
    
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
            
            # Store previous values for logging
            previous_assigned_to = lead.assigned_to
            previous_department = lead.department
            
            # Update assigned to user
            lead.assigned_to = user
            
            # IMPORTANT: Always update department when assigning to a new user
            if user.department_id:
                lead.department = user.department
                
                # Debug logging
                print(f"Updating lead {lead.id} department from {previous_department.id if previous_department else None} to {user.department.id}")
            else:
                print(f"WARNING: User {user.id} has no department_id, lead department not updated")
            
            lead.save()
            
            # Create a note for the assignment and department change
            note_text = f"Lead assigned to {user.get_full_name() or user.email}"
            if previous_department != lead.department:
                dept_name = lead.department.name if lead.department else "None"
                note_text += f" and moved to {dept_name} department"
            
            LeadNote.objects.create(
                lead=lead,
                tenant=lead.tenant,
                added_by=request.user,
                note=note_text
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
    
    @action(detail=False, methods=['get'])
    def by_role(self, request):
        """Get leads filtered based on the user's role."""
        # The get_queryset method already contains the role-based filtering
        queryset = self.get_queryset()
        
        # Debug logging
        print(f"by_role endpoint called by user {request.user.id} with role {request.user.role}")
        print(f"Department ID from user: {request.user.department_id}")
        
        # Apply additional filters from query params
        queryset = self.filter_queryset(queryset)
        
        # Log the lead count
        lead_count = queryset.count()
        print(f"Returning {lead_count} leads for user {request.user.email}")
        
        # Get page if pagination is enabled
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """Override update method to handle department changes when assigned_to changes."""
        # Get the lead object
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Check if we're updating assigned_to
        assigned_to_id = request.data.get('assigned_to')
        if assigned_to_id and str(instance.assigned_to_id) != str(assigned_to_id):
            print(f"Lead reassignment detected via update. Old: {instance.assigned_to_id}, New: {assigned_to_id}")
            
            try:
                # Get the new assigned user
                new_user = User.objects.get(id=assigned_to_id)
                
                # Check if we need to update the department
                if new_user.department_id:
                    # Store old department for logging
                    old_department = instance.department
                    
                    # Update the lead's department to match the new user's department
                    request.data['department'] = str(new_user.department_id)
                    print(f"Updating department from {old_department.id if old_department else None} to {new_user.department_id}")
                    
                    # Add a note about the reassignment and department change
                    LeadNote.objects.create(
                        lead=instance,
                        tenant=instance.tenant,
                        added_by=request.user,
                        note=f"Lead reassigned to {new_user.get_full_name() or new_user.email} "
                             f"and moved to {new_user.department.name} department"
                    )
            except User.DoesNotExist:
                print(f"Warning: Couldn't find user with ID {assigned_to_id}")
        
        # Continue with normal update
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    def perform_update(self, serializer):
        """Custom update logic to ensure department alignment with assigned user."""
        # Get the assigned_to value from validated data
        assigned_to = serializer.validated_data.get('assigned_to')
        
        # If assigned_to is being updated, make sure department matches
        if assigned_to and not serializer.validated_data.get('department'):
            if hasattr(assigned_to, 'department') and assigned_to.department:
                serializer.validated_data['department'] = assigned_to.department
                print(f"Setting department to match assigned user in perform_update: {assigned_to.department.id}")
        
        serializer.save()

    @action(detail=True, methods=['get'])
    def get_activities(self, request, pk=None):
        """Get all activities for a specific lead."""
        lead = self.get_object()
        activities = LeadActivity.objects.filter(lead=lead).order_by('-created_at')
        serializer = LeadActivitySerializer(activities, many=True, context={'request': request})
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
        
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to handle non-existent profiles gracefully."""
        try:
            return super().retrieve(request, *args, **kwargs)
        except LeadProfile.DoesNotExist:
            # Return empty profile data instead of 404
            return Response({
                'qualified_lead': False,
                'buying_level': 'medium',
                'previous_purchase': False,
                'previous_purchase_amount': None,
                'engagement_score': 0,
                'response_time_score': 0,
                'budget_match_score': 0,
                'overall_score': 0
            })


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
