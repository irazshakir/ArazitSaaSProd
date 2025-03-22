from rest_framework import serializers
from .models import Team, TeamManager, TeamLead, TeamMember
from users.serializers import UserSerializer

class TeamSerializer(serializers.ModelSerializer):
    """Serializer for the Team model."""
    department_head_details = UserSerializer(source='department_head', read_only=True)
    
    class Meta:
        model = Team
        fields = ('id', 'name', 'description', 'tenant', 'department', 'branch', 
                 'department_head', 'department_head_details', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class TeamManagerSerializer(serializers.ModelSerializer):
    """Serializer for the TeamManager model."""
    manager_details = UserSerializer(source='manager', read_only=True)
    
    class Meta:
        model = TeamManager
        fields = ('id', 'team', 'manager', 'manager_details')
        read_only_fields = ('id',)
        
    def validate(self, attrs):
        # Additional validation logic can be added here
        return attrs

class TeamLeadSerializer(serializers.ModelSerializer):
    """Serializer for the TeamLead model."""
    team_lead_details = UserSerializer(source='team_lead', read_only=True)
    manager_details = serializers.SerializerMethodField()
    
    class Meta:
        model = TeamLead
        fields = ('id', 'team', 'manager', 'team_lead', 'team_lead_details', 'manager_details')
        read_only_fields = ('id',)
    
    def get_manager_details(self, obj):
        return {
            'id': obj.manager.manager.id,
            'email': obj.manager.manager.email,
            'name': f"{obj.manager.manager.first_name} {obj.manager.manager.last_name}"
        }
        
    def validate(self, attrs):
        # Additional validation logic can be added here
        return attrs

class TeamMemberSerializer(serializers.ModelSerializer):
    """Serializer for the TeamMember model."""
    member_details = UserSerializer(source='member', read_only=True)
    team_lead_details = serializers.SerializerMethodField()
    
    class Meta:
        model = TeamMember
        fields = ('id', 'team', 'team_lead', 'member', 'member_details', 
                 'team_lead_details', 'joined_at', 'is_active')
        read_only_fields = ('id', 'joined_at')
    
    def get_team_lead_details(self, obj):
        return {
            'id': obj.team_lead.team_lead.id,
            'email': obj.team_lead.team_lead.email,
            'name': f"{obj.team_lead.team_lead.first_name} {obj.team_lead.team_lead.last_name}"
        }
        
    def validate(self, attrs):
        # Additional validation logic can be added here
        return attrs 