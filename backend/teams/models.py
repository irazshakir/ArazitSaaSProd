from django.db import models

# Create your models here.
from django.db import models
import uuid
from django.core.exceptions import ValidationError
from django.db.models import Q
from users.models import User, Department, Branch, Tenant

class Team(models.Model):
    """Team model to manage hierarchical team structures within departments."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    # Team belongs to a tenant and specific branch and department
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='teams')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='teams')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='teams')
    
    # Team lead (could be null if not assigned yet)
    team_lead = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='led_teams',
        limit_choices_to={'role': User.ROLE_TEAM_LEAD}
    )
    
    # Manager overseeing the team (optional)
    manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_teams',
        limit_choices_to={'role': User.ROLE_MANAGER}
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('name', 'department', 'branch', 'tenant')
    
    def __str__(self):
        return f"{self.name} - {self.department.name} ({self.branch.name})"
    
    def clean(self):
        """Validate that team_lead belongs to the same tenant, branch and department."""
        if self.team_lead:
            if self.team_lead.tenant_id != self.tenant.id:
                raise ValidationError("Team lead must belong to the same tenant")
            if self.team_lead.branch != self.branch:
                raise ValidationError("Team lead must belong to the same branch")
            if self.team_lead.department != self.department:
                raise ValidationError("Team lead must belong to the same department")
            if self.team_lead.role != User.ROLE_TEAM_LEAD:
                raise ValidationError("User must have team lead role to be assigned as team lead")
        
        if self.manager:
            if self.manager.tenant_id != self.tenant.id:
                raise ValidationError("Manager must belong to the same tenant")
            if self.manager.branch != self.branch:
                raise ValidationError("Manager must belong to the same branch")
            if self.manager.department != self.department:
                raise ValidationError("Manager must belong to the same department")
            if self.manager.role != User.ROLE_MANAGER:
                raise ValidationError("User must have manager role to be assigned as manager")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class TeamMember(models.Model):
    """Model to associate users with teams."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='team_memberships')
    
    # Additional team-specific information
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('team', 'user')
    
    def __str__(self):
        return f"{self.user.email} - {self.team.name}"
    
    def clean(self):
        """Validate that user belongs to the same tenant, branch and department as the team."""
        if self.user.tenant_id != self.team.tenant.id:
            raise ValidationError("User must belong to the same tenant as the team")
        if self.user.branch != self.team.branch:
            raise ValidationError("User must belong to the same branch as the team")
        if self.user.department != self.team.department:
            raise ValidationError("User must belong to the same department as the team")
        
        # Validate that the user's role is appropriate for team membership
        valid_roles = [
            User.ROLE_SALES_AGENT, 
            User.ROLE_SUPPORT_AGENT, 
            User.ROLE_PROCESSOR
        ]
        if self.user.role not in valid_roles:
            raise ValidationError(f"Only users with roles {', '.join(valid_roles)} can be team members")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class DepartmentHead(models.Model):
    """Model to track department heads for each department within branches."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='department_heads')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='department_heads')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='heads')
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='headed_departments',
        limit_choices_to={'role': User.ROLE_DEPARTMENT_HEAD}
    )
    
    appointed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('branch', 'department', 'tenant')
    
    def __str__(self):
        return f"{self.user.email} - Head of {self.department.name} at {self.branch.name}"
    
    def clean(self):
        """Validate that user belongs to the same tenant, branch and department."""
        if self.user.tenant_id != self.tenant.id:
            raise ValidationError("User must belong to the same tenant")
        if self.user.branch != self.branch:
            raise ValidationError("User must belong to the same branch")
        if self.user.department != self.department:
            raise ValidationError("User must belong to the same department")
        if self.user.role != User.ROLE_DEPARTMENT_HEAD:
            raise ValidationError("User must have department head role to be assigned as department head")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)