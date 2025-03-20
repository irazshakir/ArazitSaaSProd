from .models import Team, TeamMember, DepartmentHead
from backend.users.models import User, Department, Branch, Tenant

def get_user_hierarchy(user):
    """Get the hierarchical structure for a user based on their role."""
    result = {
        'user': user,
        'subordinates': []
    }
    
    # If user is admin or tenant owner, return all users in the tenant
    if user.is_tenant_owner or user.role == User.ROLE_ADMIN:
        result['subordinates'] = User.objects.filter(tenant_id=user.tenant_id).exclude(id=user.id)
        return result
    
    # If user is department head
    if user.role == User.ROLE_DEPARTMENT_HEAD:
        # Get all managers in their department
        managers = User.objects.filter(
            tenant_id=user.tenant_id,
            branch=user.branch,
            department=user.department,
            role=User.ROLE_MANAGER
        )
        result['subordinates'] = managers
        
        # Get all team leads under those managers
        team_leads = []
        for manager in managers:
            teams = Team.objects.filter(manager=manager)
            for team in teams:
                if team.team_lead and team.team_lead not in team_leads:
                    team_leads.append(team.team_lead)
        
        # Get all team members under those team leads
        team_members = []
        for team_lead in team_leads:
            teams = Team.objects.filter(team_lead=team_lead)
            for team in teams:
                members = TeamMember.objects.filter(team=team).select_related('user')
                team_members.extend([member.user for member in members])
        
        result['team_leads'] = team_leads
        result['team_members'] = team_members
        return result
    
    # If user is manager
    if user.role == User.ROLE_MANAGER:
        # Get all teams managed by this user
        teams = Team.objects.filter(manager=user)
        
        # Get all team leads
        team_leads = [team.team_lead for team in teams if team.team_lead]
        result['subordinates'] = team_leads
        
        # Get all team members under those team leads
        team_members = []
        for team in teams:
            members = TeamMember.objects.filter(team=team).select_related('user')
            team_members.extend([member.user for member in members])
        
        result['team_members'] = team_members
        return result
    
    # If user is team lead
    if user.role == User.ROLE_TEAM_LEAD:
        # Get all teams led by this user
        teams = Team.objects.filter(team_lead=user)
        
        # Get all team members
        team_members = []
        for team in teams:
            members = TeamMember.objects.filter(team=team).select_related('user')
            team_members.extend([member.user for member in members])
        
        result['subordinates'] = team_members
        return result
    
    # For other roles, return empty subordinates
    return result

def assign_user_to_team(user, team):
    """Assign a user to a team if they meet the criteria."""
    # Check if user can be a team member
    if user.role not in [User.ROLE_SALES_AGENT, User.ROLE_SUPPORT_AGENT, User.ROLE_PROCESSOR]:
        raise ValueError(f"User with role {user.role} cannot be assigned as a team member")
    
    # Check if user belongs to the same tenant, branch and department
    if user.tenant_id != team.tenant.id:
        raise ValueError("User must belong to the same tenant as the team")
    if user.branch != team.branch:
        raise ValueError("User must belong to the same branch as the team")
    if user.department != team.department:
        raise ValueError("User must belong to the same department as the team")
    
    # Create team membership
    team_member, created = TeamMember.objects.get_or_create(
        team=team,
        user=user,
        defaults={'is_active': True}
    )
    
    if not created:
        # Update is_active if the user was already a member
        team_member.is_active = True
        team_member.save()
    
    return team_member

def create_department_structure(tenant, branch, department_name):
    """
    Create a complete department structure including department,
    department head, managers, teams, and team leads.
    """
    # First, ensure the department exists
    department, _ = Department.objects.get_or_create(
        name=department_name,
        defaults={'description': f"{department_name} department"}
    )
    
    # Create department head position (without assigning a user yet)
    dept_head, _ = DepartmentHead.objects.get_or_create(
        tenant=tenant,
        branch=branch,
        department=department,
        defaults={'is_active': True}
    )
    
    # Create a default team for this department
    default_team, _ = Team.objects.get_or_create(
        name=f"{department_name} Team",
        tenant=tenant,
        branch=branch,
        department=department,
        defaults={
            'description': f"Default team for {department_name} department"
        }
    )
    
    return {
        'department': department,
        'department_head': dept_head,
        'default_team': default_team
    }
