from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from ..models import Team, TeamMember, DepartmentHead
from .serializers import (
    TeamSerializer, TeamMemberSerializer, 
    DepartmentHeadSerializer, TeamHierarchySerializer
)
from backend.users.models import User, Department, Branch
from ..utils import get_user_hierarchy, assign_user_to_team

# Create your views here.

class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    
    def get_queryset(self):
        """Filter teams based on the user's tenant."""
        user = self.request.user
        queryset = Team.objects.all()
        
        # Filter by tenant
        queryset = queryset.filter(tenant_id=user.tenant_id)
        
        # Apply additional filters from query params
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
            
        department_id = self.request.query_params.get('department_id')
        if department_id:
            queryset = queryset.filter(department_id=department_id)
            
        return queryset
    
    def perform_create(self, serializer):
        """Ensure the team is created within the user's tenant."""
        serializer.save(tenant_id=self.request.user.tenant_id)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to the team."""
        team = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {"error": "user_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id, tenant_id=request.user.tenant_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            team_member = assign_user_to_team(user, team)
            serializer = TeamMemberSerializer(team_member)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """Remove a member from the team."""
        team = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {"error": "user_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            team_member = TeamMember.objects.get(
                team=team,
                user_id=user_id
            )
            team_member.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TeamMember.DoesNotExist:
            return Response(
                {"error": "User is not a member of this team"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def hierarchy(self, request):
        """Get team hierarchy for the user's department and branch."""
        user = request.user
        
        # If no department or branch specified, use the user's
        department_id = request.query_params.get('department_id', user.department_id if user.department else None)
        branch_id = request.query_params.get('branch_id', user.branch_id if user.branch else None)
        
        if not department_id or not branch_id:
            return Response(
                {"error": "Department and branch are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            department = Department.objects.get(id=department_id)
            branch = Branch.objects.get(id=branch_id)
        except (Department.DoesNotExist, Branch.DoesNotExist):
            return Response(
                {"error": "Department or branch not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get department head
        try:
            dept_head = DepartmentHead.objects.get(
                tenant_id=user.tenant_id,
                branch=branch,
                department=department,
                is_active=True
            )
            dept_head_user = dept_head.user
        except DepartmentHead.DoesNotExist:
            dept_head_user = None
        
        # Get managers
        managers = User.objects.filter(
            tenant_id=user.tenant_id,
            branch=branch,
            department=department,
            role=User.ROLE_MANAGER
        )
        
        # Get teams and their members
        teams = Team.objects.filter(
            tenant_id=user.tenant_id,
            branch=branch,
            department=department
        )
        
        hierarchy_data = {
            'department_head': dept_head_user,
            'managers': managers,
            'teams': teams
        }
        
        serializer = TeamHierarchySerializer(hierarchy_data)
        return Response(serializer.data)

class TeamMemberViewSet(viewsets.ModelViewSet):
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter team members based on the user's tenant."""
        user = self.request.user
        return TeamMember.objects.filter(team__tenant_id=user.tenant_id)
    
    def perform_create(self, serializer):
        """Ensure the team member belongs to a team in the user's tenant."""
        team = Team.objects.get(id=self.request.data.get('team_id'))
        if team.tenant_id != self.request.user.tenant_id:
            raise PermissionError("Cannot add member to a team from another tenant")
        serializer.save()

class DepartmentHeadViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentHeadSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter department heads based on the user's tenant."""
        user = self.request.user
        return DepartmentHead.objects.filter(tenant_id=user.tenant_id)
    
    def perform_create(self, serializer):
        """Ensure the department head is created within the user's tenant."""
        serializer.save(tenant_id=self.request.user.tenant_id)
