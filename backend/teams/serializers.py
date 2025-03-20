from rest_framework import serializers
from .models import Team, TeamMember, DepartmentHead
from backend.users.models import User

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'profile_picture']

class TeamMemberSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = TeamMember
        fields = ['id', 'user', 'user_id', 'joined_at', 'is_active']
        read_only_fields = ['joined_at']

class TeamSerializer(serializers.ModelSerializer):
    members = TeamMemberSerializer(many=True, read_only=True, source='members.all')
    team_lead_details = UserBasicSerializer(source='team_lead', read_only=True)
    manager_details = UserBasicSerializer(source='manager', read_only=True)
    
    class Meta:
        model = Team
        fields = [
            'id', 'name', 'description', 'tenant', 'branch', 'department',
            'team_lead', 'team_lead_details', 'manager', 'manager_details', 
            'members', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class DepartmentHeadSerializer(serializers.ModelSerializer):
    user_details = UserBasicSerializer(source='user', read_only=True)
    
    class Meta:
        model = DepartmentHead
        fields = [
            'id', 'tenant', 'branch', 'department', 'user', 
            'user_details', 'appointed_at', 'is_active'
        ]
        read_only_fields = ['appointed_at']

class TeamHierarchySerializer(serializers.Serializer):
    """Serializer for displaying team hierarchy."""
    department_head = UserBasicSerializer(allow_null=True)
    managers = UserBasicSerializer(many=True)
    teams = serializers.SerializerMethodField()
    
    def get_teams(self, obj):
        result = []
        for team in obj['teams']:
            team_data = {
                'id': team.id,
                'name': team.name,
                'team_lead': UserBasicSerializer(team.team_lead).data if team.team_lead else None,
                'members': UserBasicSerializer(
                    [m.user for m in TeamMember.objects.filter(team=team)], 
                    many=True
                ).data
            }
            result.append(team_data)
        return result