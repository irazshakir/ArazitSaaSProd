from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
import pandas as pd
import uuid
import json
from datetime import timedelta
from django.db import transaction

from users.models import User, Department, Tenant
from .models import (
    Lead, LeadActivity, LeadNote, LeadDocument, 
    LeadEvent, LeadProfile, LeadOverdue, Notification
)
from .serializers import (
    LeadSerializer, LeadListSerializer, LeadActivitySerializer,
    LeadNoteSerializer, LeadDocumentSerializer, LeadEventSerializer,
    LeadProfileSerializer, LeadOverdueSerializer, NotificationSerializer
)
from teams.models import TeamManager, TeamLead, TeamMember
from location_routing.models import LocationRouting

# Create your views here.

# Custom pagination class that increases page size for admin users
class LeadPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 1000
    
    def get_page_size(self, request):
        # Check if the user is an admin
        if request.user.role == 'admin':
            # For admin users, use a larger page size
            return 100  # You can adjust this value as needed
        return self.page_size

# Function to assign leads using location routing
def assign_lead_by_location(tenant, city, lead):
    """
    Assigns a lead to a user based on city/location routing
    Returns the assigned user and whether location routing was used
    """
    try:
        # Normalize the city name
        normalized_city = city.lower().strip() if city else ""
        
        if not normalized_city:
            return None, False
            
        # Check if we have a location routing configuration
        location_routing = LocationRouting.objects.filter(
            tenant_id=str(tenant.id),
            is_active=True
        ).first()
        
        if not location_routing:
            return None, False
            
        # Check if this city exists in the locations
        if normalized_city in location_routing.locations:
            # Get the next available user based on round-robin
            next_user_id = location_routing.get_next_available_user()
            
            if next_user_id:
                user = User.objects.filter(id=next_user_id).first()
                if user:
                    # Update branch based on assigned user
                    if user.branch:
                        lead.branch = user.branch
                    return user, True
    
    except Exception as e:
        print(f"Error in location routing: {str(e)}")
    
    return None, False

# Function to get next sales agent using round-robin
def get_next_sales_agent(tenant):
    """
    Get the next sales agent for lead assignment using round-robin
    """
    # Get all active sales agents for this tenant
    sales_agents = User.objects.filter(
        tenant_users__tenant=tenant,
        role='sales_agent',
        is_active=True
    )
    
    if not sales_agents.exists():
        return None
        
    # Get lead counts for each agent
    agent_lead_counts = {}
    
    for agent in sales_agents:
        lead_count = Lead.objects.filter(
            tenant=tenant,
            assigned_to_id=agent.id
        ).count()
        
        agent_lead_counts[agent.id] = {
            'agent': agent,
            'lead_count': lead_count
        }
        
    # Find the agent with the minimum lead count
    if agent_lead_counts:
        min_count = float('inf')
        next_agent = None
        
        for agent_data in agent_lead_counts.values():
            if agent_data['lead_count'] < min_count:
                min_count = agent_data['lead_count']
                next_agent = agent_data['agent']
                
        if next_agent:
            return next_agent
    
    # Fallback to the first sales agent
    return sales_agents.first()

# LeadViewSet with bulk upload action
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
    pagination_class = LeadPagination
    
    def get_queryset(self):
        """
        Filter queryset to only show leads from tenants the user has access to.
        Also applies any additional filters from query parameters.
        """
        user = self.request.user
        queryset = super().get_queryset()

        # Filter by tenant access
        accessible_tenants = user.tenant_users.values_list('tenant_id', flat=True)
        queryset = queryset.filter(tenant_id__in=accessible_tenants)

        # Apply status filter if provided
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)

        # Apply date range filters if provided
        created_after = self.request.query_params.get('created_after', None)
        created_before = self.request.query_params.get('created_before', None)
        if created_after:
            queryset = queryset.filter(created_at__gte=created_after)
        if created_before:
            queryset = queryset.filter(created_at__lte=created_before)

        # Apply assigned_to filter if provided
        assigned_to = self.request.query_params.get('assigned_to', None)
        if assigned_to:
            if assigned_to.lower() == 'me':
                queryset = queryset.filter(assigned_to=user)
            elif assigned_to.lower() == 'unassigned':
                queryset = queryset.filter(assigned_to__isnull=True)
            else:
                try:
                    assigned_user_id = int(assigned_to)
                    queryset = queryset.filter(assigned_to_id=assigned_user_id)
                except ValueError:
                    pass

        return queryset.select_related('tenant', 'assigned_to', 'created_by', 'branch')
    
    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        
        # Handle department filtering
        department_id = self.request.query_params.get('department')
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        
        # Handle branch filtering
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
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
    
    def get_serializer_context(self):
        """
        Add tenant to serializer context based on user's active tenant.
        For create/update operations, use the tenant from the request data if provided,
        otherwise use the first tenant the user belongs to.
        """
        context = super().get_serializer_context()
        user = self.request.user
        
        # For create/update operations, check if tenant is specified in request data
        if self.request.data and 'tenant' in self.request.data:
            try:
                tenant_id = self.request.data['tenant']
                # Verify user has access to this tenant
                if user.tenant_users.filter(tenant_id=tenant_id).exists():
                    context['tenant'] = Tenant.objects.get(id=tenant_id)
                else:
                    raise PermissionError("User does not have access to the specified tenant")
            except (Tenant.DoesNotExist, ValueError):
                raise serializers.ValidationError({"tenant": "Invalid tenant specified"})
        else:
            # Default to user's first tenant if not specified
            tenant = user.tenant_users.first()
            if tenant:
                context['tenant'] = tenant.tenant
            else:
                raise serializers.ValidationError({"tenant": "User must belong to at least one tenant"})
        
        return context
    
    def perform_create(self, serializer):
        """Set the tenant and department based on the user."""
        user = self.request.user
        tenant_user = user.tenant_users.filter(Q(role='owner') | Q(tenant__is_active=True)).first()
        
        if not tenant_user:
            raise ValidationError("User does not belong to any tenant")
            
        # Get the assigned_to user from request data
        assigned_to_id = self.request.data.get('assigned_to')
        department = None
        branch = None
        
        # If assigned_to is provided, use that user's department and branch
        if assigned_to_id:
            try:
                assigned_user = User.objects.get(id=assigned_to_id)
                department = assigned_user.department
                branch = assigned_user.branch
            except User.DoesNotExist:
                # If assigned user doesn't exist, don't set department or branch
                pass
        else:
            # If no assigned_to, use the current user's department and branch
            department = user.department
            branch = user.branch
        
        lead = serializer.save(
            tenant=tenant_user.tenant,
            department=department,
            branch=branch
        )
        
        # Create notification for lead assignment if assigned_to is different from created_by
        if lead.assigned_to and lead.assigned_to != lead.created_by:
            Notification.objects.create(
                tenant=lead.tenant,
                user=lead.assigned_to,
                notification_type=Notification.TYPE_LEAD_ASSIGNED,
                title=f"New Lead Assigned: {lead.name}",
                message=f"You have been assigned a new lead: {lead.name}",
                lead=lead
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
            previous_branch = lead.branch
            
            # Update assigned to user
            lead.assigned_to = user
            
            # IMPORTANT: Always update department when assigning to a new user
            if user.department_id:
                lead.department = user.department
            
            # IMPORTANT: Always update branch when assigning to a new user
            if user.branch_id:
                lead.branch = user.branch
            
            lead.save()
            
            # Create a note for the assignment and department/branch change
            note_text = f"Lead assigned to {user.get_full_name() or user.email}"
            if previous_department != lead.department:
                dept_name = lead.department.name if lead.department else "None"
                note_text += f" and moved to {dept_name} department"
            if previous_branch != lead.branch:
                branch_name = lead.branch.name if lead.branch else "None"
                note_text += f" and assigned to {branch_name} branch"
            
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
    def update_activity_status(self, request, pk=None):
        """Update the activity status of a lead."""
        lead = self.get_object()
        activity_status = request.data.get('lead_activity_status')
        
        if not activity_status:
            return Response(
                {"error": "Activity status is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if activity_status not in dict(Lead.ACTIVITY_STATUS_CHOICES):
            return Response(
                {"error": "Invalid activity status value"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_activity_status = lead.get_lead_activity_status_display()
        
        # Check if this is a change
        if lead.lead_activity_status == activity_status:
            return Response(
                {"message": "No change in activity status"}, 
                status=status.HTTP_200_OK
            )
        
        # Update the lead activity status
        lead.lead_activity_status = activity_status
        lead.save()
        
        # Create a note for the activity status change
        LeadNote.objects.create(
            lead=lead,
            tenant=lead.tenant,
            added_by=request.user,
            note=f"Activity status changed from {old_activity_status} to {lead.get_lead_activity_status_display()}"
        )
        
        # Create appropriate lead event
        if activity_status == Lead.ACTIVITY_STATUS_INACTIVE:
            # Create CLOSED event
            LeadEvent.objects.create(
                lead=lead,
                tenant=lead.tenant,
                event_type=LeadEvent.EVENT_CLOSED,
                updated_by=request.user
            )
        elif activity_status == Lead.ACTIVITY_STATUS_ACTIVE and old_activity_status == Lead.ACTIVITY_STATUS_CHOICES[1][1]:  # Inactive
            # Create REOPENED event
            LeadEvent.objects.create(
                lead=lead,
                tenant=lead.tenant,
                event_type=LeadEvent.EVENT_REOPENED,
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
            activity = serializer.save(lead=lead, tenant=lead.tenant)
            
            # Update last_contacted
            lead.last_contacted = timezone.now()
            lead.save()
            
            # Create notification for activity reminder if due_date is set
            if activity.due_date and activity.user:
                Notification.objects.create(
                    tenant=lead.tenant,
                    user=activity.user,
                    notification_type=Notification.TYPE_ACTIVITY_REMINDER,
                    title=f"Activity Reminder: {activity.activity_type}",
                    message=f"Reminder for activity: {activity.description}",
                    lead=lead,
                    lead_activity=activity
                )
            
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
        
        # Create notification for overdue lead
        if lead.assigned_to:
            Notification.objects.create(
                tenant=lead.tenant,
                user=lead.assigned_to,
                notification_type=Notification.TYPE_LEAD_OVERDUE,
                title=f"Lead Overdue: {lead.name}",
                message=f"The lead {lead.name} has been marked as overdue",
                lead=lead,
                lead_overdue=overdue
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
    def by_branch(self, request):
        """Get leads filtered by branch."""
        branch_id = request.query_params.get('branch')
        
        if not branch_id:
            return Response(
                {"error": "Branch parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leads = self.get_queryset().filter(branch_id=branch_id)
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
        
        # Apply additional filters from query params
        queryset = self.filter_queryset(queryset)
        
        # Note: Custom ordering is already applied in get_queryset
        
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
                    
                    # Add a note about the reassignment and department change
                    note_text = f"Lead reassigned to {new_user.get_full_name() or new_user.email} and moved to {new_user.department.name} department"
                    
                    # Check if we need to update the branch
                    if new_user.branch_id:
                        old_branch = instance.branch
                        
                        # Update the lead's branch to match the new user's branch
                        request.data['branch'] = str(new_user.branch_id)
                        
                        # Add branch information to the note
                        note_text += f" and assigned to {new_user.branch.name} branch"
                    
                    LeadNote.objects.create(
                        lead=instance,
                        tenant=instance.tenant,
                        added_by=request.user,
                        note=note_text
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
        if assigned_to:
            if hasattr(assigned_to, 'department') and assigned_to.department and not serializer.validated_data.get('department'):
                serializer.validated_data['department'] = assigned_to.department
            
            # Also make sure branch matches
            if hasattr(assigned_to, 'branch') and assigned_to.branch and not serializer.validated_data.get('branch'):
                serializer.validated_data['branch'] = assigned_to.branch
        
        # Ensure tenant is preserved
        serializer.save(tenant=self.request.user.tenant)

    @action(detail=True, methods=['get'])
    def get_activities(self, request, pk=None):
        """Get all activities for a specific lead."""
        lead = self.get_object()
        activities = LeadActivity.objects.filter(lead=lead).order_by('-created_at')
        serializer = LeadActivitySerializer(activities, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        """Upload and process bulk leads from CSV or Excel file"""
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response(
                {"error": "No file uploaded", "success": False},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get tenant ID from request
        tenant_id = request.query_params.get('tenant')
        if not tenant_id:
            return Response(
                {"error": "Tenant ID is required", "success": False},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            return Response(
                {"error": "Invalid tenant ID", "success": False},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get lead type or use default
        lead_type = request.data.get('lead_type', 'study_visa')
        
        # Find the sales department
        sales_department = Department.objects.filter(
            tenant=tenant,
            name__icontains='sales'
        ).first()
        
        # If no sales department found, use the default sales department ID
        department_id = str(sales_department.id) if sales_department else "8e9a7cbc-7974-4f0d-b937-18bbd616afb0"
        
        # Define region city mapping
        punjab_cities = [
            "lahore", "faisalabad", "multan", "gujranwala", "sialkot", "bahawalpur", 
            "sargodha", "sheikhupura", "rahim yar khan", "jhelum", "gujrat", "okara", 
            "dera ghazi khan", "muzaffargarh", "mianwali", "kasur", "toba tek singh", 
            "bhakkar", "vehari", "mian channu", "chichawatni", "mandi bahauddin", 
            "pakpattan", "lodhran", "narowal", "khushab", "hafizabad", "jhang", 
            "kamalia", "burewala", "samundri", "shorkot", "arifwala", "khanewal", 
            "daska", "kamoke", "murree", "attock", "kot addu", "chiniot", "talagang", 
            "haroonabad", "fort abbas", "kabirwala", "tandlianwala", "ahmadpur east", 
            "kharian", "wazirabad"
        ]
        
        north_cities = [
            "islamabad", "rawalpindi", "abbottabad", "peshawar", "mardan", "swabi", 
            "nowshera", "charsadda", "dera ismail khan", "kohat", "bannu", "mansehra", 
            "haripur", "swat", "mingora", "battagram", "shangla", "buner", "dir lower", 
            "dir upper", "chitral", "tank", "lakki marwat", "hangu", "karak", "toru", 
            "takht bhai", "jamrud", "landi kotal", "parachinar", "thall", "alpuri", 
            "besham", "matta", "timergara", "wana", "miranshah", "torkham", "gomal", 
            "barikot", "daggar", "topi", "shabqadar", "malakand", "paharpur"
        ]
        
        sindh_cities = [
            "karachi", "hyderabad", "sukkur", "larkana", "nawabshah", "mirpur khas", 
            "jacobabad", "shikarpur", "dadu", "khairpur", "thatta", "badin", 
            "tando adam", "tando allahyar", "jamshoro", "matiari", "umerkot", 
            "sanghar", "ghotki", "kashmore", "kandhkot", "sehwan", "tharparkar", 
            "mithi", "tando muhammad khan", "qamber shahdadkot"
        ]
        
        # Define branch names for each region
        punjab_branches = ["lahore", "faisalabad", "gujrat", "gujranwala", "multan", "sialkot"]
        north_branches = ["rawalpindi", "peshawar", "islamabad", "swat", "quetta"]
        sindh_branches = ["karachi", "hyderabad", "sukkur"]
        
        # Try to read the file based on extension
        try:
            file_ext = file_obj.name.split('.')[-1].lower()
            
            if file_ext == 'csv':
                df = pd.read_csv(file_obj)
            elif file_ext in ['xls', 'xlsx']:
                df = pd.read_excel(file_obj)
            else:
                return Response(
                    {"error": "Unsupported file format. Please upload CSV or Excel file.", "success": False},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Standardize column names by converting to lowercase and removing spaces
            df.columns = [col.lower().replace(' ', '_') for col in df.columns]
            
            # Check if required columns exist
            required_cols = ['name', 'phone']
            missing_cols = [col for col in required_cols if col not in df.columns]
            
            if missing_cols:
                missing_cols_str = ', '.join(missing_cols)
                return Response(
                    {"error": f"Required columns missing: {missing_cols_str}", "success": False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Define column mappings (handle different column names)
            column_mappings = {
                'name': ['name', 'full_name', 'customer_name', 'client_name'],
                'email': ['email', 'email_address', 'customer_email'],
                'phone': ['phone', 'phone_number', 'mobile', 'contact_number', 'customer_phone'],
                'whatsapp': ['whatsapp', 'whatsapp_number', 'whatsapp_contact'],
                'city': ['city', 'town', 'location', 'customer_city', 'customer_location']
            }
            
            # Map columns based on the mappings
            for target_col, possible_cols in column_mappings.items():
                if target_col not in df.columns:
                    for col in possible_cols:
                        if col in df.columns:
                            df[target_col] = df[col]
                            break
            
            # Fill missing values
            if 'email' not in df.columns:
                df['email'] = None
            if 'whatsapp' not in df.columns:
                df['whatsapp'] = df['phone']
            if 'city' not in df.columns:
                df['city'] = None
            
            created_leads = []
            errors = []
            
            # Cache users by branch for round-robin assignment
            users_by_region = {
                'punjab': [],
                'north': [],
                'sindh': [],
                'default': []
            }
            
            # Get all active users for this tenant
            all_tenant_users = User.objects.filter(
                tenant_users__tenant=tenant,
                is_active=True,
                role='sales_agent'  # Filter for sales_agent role only
            )
            
            # Group users by their branch
            for user in all_tenant_users:
                if user.branch and user.branch.name:
                    branch_name = user.branch.name.lower()
                    
                    if branch_name in punjab_branches:
                        users_by_region['punjab'].append(user)
                    elif branch_name in north_branches:
                        users_by_region['north'].append(user)
                    elif branch_name in sindh_branches:
                        users_by_region['sindh'].append(user)
                    else:
                        users_by_region['default'].append(user)
                else:
                    users_by_region['default'].append(user)
            
            # Find an admin user for fallback assignment for unmatched cities
            admin_user = User.objects.filter(
                tenant_users__tenant=tenant,
                is_active=True,
                role='admin'
            ).first()
            
            # Counters for round-robin assignment
            region_counters = {
                'punjab': 0,
                'north': 0,
                'sindh': 0,
                'default': 0
            }
            
            # Function to get next user by region using round-robin
            def get_next_user_by_region(region):
                users = users_by_region[region]
                
                if not users:
                    # If no users in the specific region, fallback to default users
                    users = users_by_region['default']
                    if not users:
                        # If no default users either, return None
                        return None
                    
                    # Use the counter for default region
                    region_to_use = 'default'
                else:
                    region_to_use = region
                
                # Get the next user index
                index = region_counters[region_to_use]
                # Update counter for next time
                region_counters[region_to_use] = (index + 1) % len(users)
                
                # Return the user
                return users[index] if users else None
            
            # Track already processed phone numbers to avoid duplicates
            processed_phones = set()
            # Get existing phone numbers in the database for this tenant
            existing_phones = set(Lead.objects.filter(tenant=tenant).values_list('phone', flat=True))
            
            with transaction.atomic():
                # Process each row in the dataframe
                for index, row in df.iterrows():
                    try:
                        # Create lead with basic information
                        name = str(row['name'])
                        phone = str(row['phone'])
                        
                        # Skip if this phone has already been processed in this batch
                        if phone in processed_phones:
                            continue
                            
                        # Skip if this phone already exists in the database
                        if phone in existing_phones:
                            continue
                        
                        # Add to processed phones set to avoid duplicates later in this batch
                        processed_phones.add(phone)
                        
                        email = str(row['email']) if pd.notna(row['email']) else f"{phone}@gmail.com"
                        whatsapp = str(row['whatsapp']) if pd.notna(row['whatsapp']) else phone
                        city = str(row['city']).lower().strip() if pd.notna(row['city']) else None
                        
                        # Create a new lead object
                        lead = Lead(
                            id=uuid.uuid4(),
                            tenant=tenant,
                            created_by=request.user,
                            lead_type=lead_type,
                            name=name,
                            email=email,
                            phone=phone,
                            whatsapp=whatsapp,
                            query_for={},
                            status='new',
                            source='fb_form',
                            lead_activity_status='active',
                            created_at=timezone.now(),
                            updated_at=timezone.now(),
                            last_contacted=timezone.now(),
                            next_follow_up=timezone.now() + timedelta(days=1),
                            tags=None,
                            custom_fields=None,
                            chat_id=None
                        )
                        
                        # Determine the region based on city
                        region = 'default'
                        if city:
                            if city in punjab_cities:
                                region = 'punjab'
                            elif city in north_cities:
                                region = 'north'
                            elif city in sindh_cities:
                                region = 'sindh'
                            else:
                                # For unmatched cities, assign directly to admin if available
                                if admin_user:
                                    lead.assigned_to = admin_user
                                    
                                    # Set branch and department from admin user
                                    if admin_user.branch:
                                        lead.branch = admin_user.branch
                                    
                                    if admin_user.department:
                                        lead.department = admin_user.department
                                    else:
                                        lead.department_id = department_id
                                        
                                    # Skip regular assignment process
                                    assigned_user = None
                                    # Save the lead immediately
                                    lead.save()
                                    
                                    # Create an initial open event
                                    LeadEvent.objects.create(
                                        lead=lead,
                                        tenant=tenant,
                                        event_type=LeadEvent.EVENT_OPEN,
                                        updated_by=request.user
                                    )
                                    
                                    created_leads.append(lead)
                                    continue  # Skip to next lead
                        
                        # Get the next user for this region using round-robin
                        assigned_user = get_next_user_by_region(region)
                        
                        # If no region-specific user found, try to get any user
                        if not assigned_user:
                            # Try default users first
                            assigned_user = get_next_user_by_region('default')
                            
                            # If still no user, try all regions
                            if not assigned_user:
                                for r in ['punjab', 'north', 'sindh']:
                                    if users_by_region[r]:
                                        assigned_user = get_next_user_by_region(r)
                                        if assigned_user:
                                            break
                                            
                            # If still no user and we have an admin, use admin as last resort
                            if not assigned_user and admin_user:
                                assigned_user = admin_user
                        
                        # Set assigned_to and department
                        if assigned_user:
                            lead.assigned_to = assigned_user
                            
                            # Set branch to the assigned user's branch
                            if assigned_user.branch:
                                lead.branch = assigned_user.branch
                            
                            # Set department to the assigned user's department or default sales department
                            if assigned_user.department:
                                lead.department = assigned_user.department
                            else:
                                lead.department_id = department_id
                        else:
                            # No user assigned, use default department
                            lead.department_id = department_id
                        
                        # Save the lead
                        lead.save()
                        
                        # Create an initial open event
                        LeadEvent.objects.create(
                            lead=lead,
                            tenant=tenant,
                            event_type=LeadEvent.EVENT_OPEN,
                            updated_by=request.user
                        )
                        
                        created_leads.append(lead)
                    
                    except Exception as e:
                        error_msg = f"Error creating lead for {row.get('name', 'unknown')}: {str(e)}"
                        errors.append(error_msg)
            
            return Response({
                "success": True,
                "message": f"Successfully uploaded {len(created_leads)} leads",
                "created_count": len(created_leads),
                "errors": errors if errors else None
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            error_msg = f"Error processing file: {str(e)}"
            import traceback
            return Response(
                {"error": error_msg, "success": False},
                status=status.HTTP_400_BAD_REQUEST
            )


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


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Notification model.
    Provides CRUD operations for Notifications.
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return notifications for the current user.
        """
        user = self.request.user
        tenant_ids = user.tenant_users.values_list('tenant', flat=True)
        return Notification.objects.filter(
            tenant__in=tenant_ids,
            user=user
        ).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a notification as read."""
        notification = self.get_object()
        notification.mark_as_read()
        return Response(self.get_serializer(notification).data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all unread notifications as read."""
        queryset = self.get_queryset().filter(status=Notification.STATUS_UNREAD)
        queryset.update(
            status=Notification.STATUS_READ,
            read_at=timezone.now()
        )
        return Response({'message': 'All notifications marked as read'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications."""
        count = self.get_queryset().filter(status=Notification.STATUS_UNREAD).count()
        return Response({'count': count})
