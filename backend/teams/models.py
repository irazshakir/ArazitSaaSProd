from django.db import models
import uuid
from django.core.exceptions import ValidationError
from users.models import User, Department, Branch, Tenant

class Team(models.Model):
    """A simplified team model focused on departmental hierarchy."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    # Core relationships
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='teams')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='teams')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='teams')
    
    # Department head (one per department)
    department_head = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_teams',
        limit_choices_to={'role': User.ROLE_DEPARTMENT_HEAD}
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('name', 'department', 'branch', 'tenant')
    
    def __str__(self):
        return f"{self.name} - {self.department.name} ({self.branch.name})"
    
    def clean(self):
        """Validate department head belongs to the same tenant, branch and department."""
        if self.department_head:
            if self.department_head.tenant_id != self.tenant.id:
                raise ValidationError("Department head must belong to the same tenant")
            if self.department_head.branch_id != self.branch.id:
                raise ValidationError("Department head must belong to the same branch")
            if self.department_head.department_id != self.department.id:
                raise ValidationError("Department head must belong to the same department")
            if self.department_head.role != User.ROLE_DEPARTMENT_HEAD:
                raise ValidationError("User must have department head role")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class TeamManager(models.Model):
    """Model for managers assigned to teams."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='managers')
    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='managed_teams',
        limit_choices_to={'role': User.ROLE_MANAGER}
    )
    
    class Meta:
        unique_together = ('team', 'manager')
    
    def __str__(self):
        return f"{self.manager.email} - Manager of {self.team.name}"
    
    def clean(self):
        """Validate manager belongs to the same tenant, branch and department."""
        if self.manager.tenant_id != self.team.tenant.id:
            raise ValidationError("Manager must belong to the same tenant as the team")
        if self.manager.branch_id != self.team.branch.id:
            raise ValidationError("Manager must belong to the same branch as the team")
        if self.manager.department_id != self.team.department.id:
            raise ValidationError("Manager must belong to the same department as the team")
        if self.manager.role != User.ROLE_MANAGER:
            raise ValidationError("User must have manager role")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class TeamLead(models.Model):
    """Model for team leads assigned under managers."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='team_leads')
    manager = models.ForeignKey(TeamManager, on_delete=models.CASCADE, related_name='team_leads')
    team_lead = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='led_teams',
        limit_choices_to={'role': User.ROLE_TEAM_LEAD}
    )
    
    class Meta:
        unique_together = ('team', 'team_lead')
    
    def __str__(self):
        return f"{self.team_lead.email} - Team Lead under {self.manager.manager.email}"
    
    def clean(self):
        """Validate team lead belongs to the same tenant, branch and department."""
        if self.team_lead.tenant_id != self.team.tenant.id:
            raise ValidationError("Team lead must belong to the same tenant as the team")
        if self.team_lead.branch_id != self.team.branch.id:
            raise ValidationError("Team lead must belong to the same branch as the team")
        if self.team_lead.department_id != self.team.department.id:
            raise ValidationError("Team lead must belong to the same department as the team")
        if self.team_lead.role != User.ROLE_TEAM_LEAD:
            raise ValidationError("User must have team lead role")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class TeamMember(models.Model):
    """Model for team members (agents/processors) assigned under team leads."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    team_lead = models.ForeignKey(TeamLead, on_delete=models.CASCADE, related_name='team_members')
    member = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='team_memberships'
    )
    
    # Additional team-specific information
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('team', 'member')
    
    def __str__(self):
        return f"{self.member.email} - Member under {self.team_lead.team_lead.email}"
    
    def clean(self):
        """Validate team member belongs to the same tenant, branch and department."""
        if self.member.tenant_id != self.team.tenant.id:
            raise ValidationError("Team member must belong to the same tenant as the team")
        if self.member.branch_id != self.team.branch.id:
            raise ValidationError("Team member must belong to the same branch as the team")
        if self.member.department_id != self.team.department.id:
            raise ValidationError("Team member must belong to the same department as the team")
        
        # Validate that the user's role is appropriate for team membership
        valid_roles = [
            User.ROLE_SALES_AGENT, 
            User.ROLE_SUPPORT_AGENT, 
            User.ROLE_PROCESSOR
        ]
        if self.member.role not in valid_roles:
            raise ValidationError(f"Only users with roles {', '.join(valid_roles)} can be team members")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
