from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import Team, TeamManager, TeamLead, TeamMember
from .serializers import (
    TeamSerializer, 
    TeamManagerSerializer, 
    TeamLeadSerializer, 
    TeamMemberSerializer
)

# Create your views here.

class TeamViewSet(viewsets.ModelViewSet):
    """ViewSet for the Team model."""
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter teams based on the authenticated user's tenant."""
        tenant_id = self.request.user.tenant_id
        return Team.objects.filter(tenant_id=tenant_id)
    
    def perform_create(self, serializer):
        """Add tenant_id automatically when creating a team."""
        serializer.save(tenant_id=self.request.user.tenant_id)
    
    @action(detail=True, methods=['get'])
    def managers(self, request, pk=None):
        """Retrieve all managers for a specific team."""
        team = self.get_object()
        managers = TeamManager.objects.filter(team=team)
        serializer = TeamManagerSerializer(managers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def team_leads(self, request, pk=None):
        """Retrieve all team leads for a specific team."""
        team = self.get_object()
        team_leads = TeamLead.objects.filter(team=team)
        serializer = TeamLeadSerializer(team_leads, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Retrieve all members for a specific team."""
        team = self.get_object()
        members = TeamMember.objects.filter(team=team)
        serializer = TeamMemberSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def hierarchy(self, request, pk=None):
        """Retrieve the complete hierarchy for a specific team."""
        team = self.get_object()
        
        # Get team details
        team_data = TeamSerializer(team).data
        
        # Get managers
        managers = TeamManager.objects.filter(team=team)
        managers_data = []
        
        for manager in managers:
            manager_data = TeamManagerSerializer(manager).data
            
            # Get team leads under this manager
            team_leads = TeamLead.objects.filter(manager=manager)
            team_leads_data = []
            
            for team_lead in team_leads:
                team_lead_data = TeamLeadSerializer(team_lead).data
                
                # Get members under this team lead
                members = TeamMember.objects.filter(team_lead=team_lead)
                members_data = TeamMemberSerializer(members, many=True).data
                
                team_lead_data['members'] = members_data
                team_leads_data.append(team_lead_data)
            
            manager_data['team_leads'] = team_leads_data
            managers_data.append(manager_data)
        
        team_data['managers'] = managers_data
        
        return Response(team_data)

class TeamManagerViewSet(viewsets.ModelViewSet):
    """ViewSet for the TeamManager model."""
    serializer_class = TeamManagerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter team managers based on the authenticated user's tenant."""
        tenant_id = self.request.user.tenant_id
        return TeamManager.objects.filter(team__tenant_id=tenant_id)
    
    @action(detail=True, methods=['get'])
    def team_leads(self, request, pk=None):
        """Retrieve all team leads under this manager."""
        manager = self.get_object()
        team_leads = TeamLead.objects.filter(manager=manager)
        serializer = TeamLeadSerializer(team_leads, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Retrieve all members that fall under this manager (via team leads)."""
        manager = self.get_object()
        team_leads = TeamLead.objects.filter(manager=manager)
        members = TeamMember.objects.filter(team_lead__in=team_leads)
        serializer = TeamMemberSerializer(members, many=True)
        return Response(serializer.data)

class TeamLeadViewSet(viewsets.ModelViewSet):
    """ViewSet for the TeamLead model."""
    serializer_class = TeamLeadSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter team leads based on the authenticated user's tenant."""
        tenant_id = self.request.user.tenant_id
        return TeamLead.objects.filter(team__tenant_id=tenant_id)
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Retrieve all members under this team lead."""
        team_lead = self.get_object()
        members = TeamMember.objects.filter(team_lead=team_lead)
        serializer = TeamMemberSerializer(members, many=True)
        return Response(serializer.data)

class TeamMemberViewSet(viewsets.ModelViewSet):
    """ViewSet for the TeamMember model."""
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter team members based on the authenticated user's tenant."""
        tenant_id = self.request.user.tenant_id
        return TeamMember.objects.filter(team__tenant_id=tenant_id)
