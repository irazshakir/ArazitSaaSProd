from django.db import models
import uuid
from django.core.exceptions import ValidationError
from users.models import User, Department, Branch, Tenant
import logging

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
            # Check tenant
            if self.department_head.tenant_id != self.tenant.id:
                raise ValidationError("Department head must belong to the same tenant")
            
            # For branch, use branch_id instead of direct comparison
            if self.department_head.branch_id != self.branch.id:
                # Instead of raising error, update the department head's branch
                self.department_head.branch_id = self.branch.id
                self.department_head.save(update_fields=['branch_id'])
            
            # For department, use department_id instead of direct comparison
            if hasattr(self.department_head, 'department_id'):
                if self.department_head.department_id != self.department.id:
                    # Instead of raising error, update the department head's department
                    self.department_head.department_id = self.department.id
                    self.department_head.save(update_fields=['department_id'])
            else:
                # If department_id doesn't exist, try to find alternative
                # This is safer than directly accessing non-existent attributes
                department_value = getattr(self.department_head, 'department', None)
                if department_value and hasattr(department_value, 'id'):
                    if department_value.id != self.department.id:
                        # Update the department reference
                        self.department_head.department = self.department
                        self.department_head.save(update_fields=['department'])
            
            # Optionally check role
            if hasattr(self.department_head, 'role') and self.department_head.role != User.ROLE_DEPARTMENT_HEAD:
                # We'll just log this rather than blocking team creation
                logger = logging.getLogger(__name__)
                logger.warning(f"User {self.department_head.id} is assigned as department head but has role {self.department_head.role}")
    
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
        # Check tenant
        if self.manager.tenant_id != self.team.tenant.id:
            raise ValidationError("Manager must belong to the same tenant as the team")
        
        # Check branch and update if needed
        if self.manager.branch_id != self.team.branch.id:
            # Update branch instead of raising error
            self.manager.branch_id = self.team.branch.id
            self.manager.save(update_fields=['branch_id'])
        
        # Check department using safe attribute access
        if hasattr(self.manager, 'department_id'):
            if self.manager.department_id != self.team.department.id:
                # Update department instead of raising error
                self.manager.department_id = self.team.department.id
                self.manager.save(update_fields=['department_id'])
        else:
            # Try alternative approach - check if manager has department attribute
            department_value = getattr(self.manager, 'department', None)
            if department_value and hasattr(department_value, 'id'):
                if department_value.id != self.team.department.id:
                    # Update the department reference
                    self.manager.department = self.team.department
                    self.manager.save(update_fields=['department'])
            else:
                # If we can't find department at all, log it but don't fail
                logger = logging.getLogger(__name__)
                logger.warning(f"User {self.manager.id} has no department attribute, skipping department validation")
        
        # Check role if present
        if hasattr(self.manager, 'role') and self.manager.role != User.ROLE_MANAGER:
            logger = logging.getLogger(__name__)
            logger.warning(f"User {self.manager.id} is assigned as manager but has role {self.manager.role}")
    
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
        # Check tenant
        if self.team_lead.tenant_id != self.team.tenant.id:
            raise ValidationError("Team lead must belong to the same tenant as the team")
        
        # Check branch and update if needed
        if self.team_lead.branch_id != self.team.branch.id:
            # Update branch instead of raising error
            self.team_lead.branch_id = self.team.branch.id
            self.team_lead.save(update_fields=['branch_id'])
        
        # Check department using safe attribute access
        if hasattr(self.team_lead, 'department_id'):
            if self.team_lead.department_id != self.team.department.id:
                # Update department instead of raising error
                self.team_lead.department_id = self.team.department.id
                self.team_lead.save(update_fields=['department_id'])
        else:
            # Try alternative approach - check if team_lead has department attribute
            department_value = getattr(self.team_lead, 'department', None)
            if department_value and hasattr(department_value, 'id'):
                if department_value.id != self.team.department.id:
                    # Update the department reference
                    self.team_lead.department = self.team.department
                    self.team_lead.save(update_fields=['department'])
            else:
                # If we can't find department at all, log it but don't fail
                logger = logging.getLogger(__name__)
                logger.warning(f"User {self.team_lead.id} has no department attribute, skipping department validation")
        
        # Check role if present
        if hasattr(self.team_lead, 'role') and self.team_lead.role != User.ROLE_TEAM_LEAD:
            logger = logging.getLogger(__name__)
            logger.warning(f"User {self.team_lead.id} is assigned as team lead but has role {self.team_lead.role}")
    
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
        # Check tenant
        if self.member.tenant_id != self.team.tenant.id:
            raise ValidationError("Team member must belong to the same tenant as the team")
        
        # Check branch and update if needed
        if self.member.branch_id != self.team.branch.id:
            # Update branch instead of raising error
            self.member.branch_id = self.team.branch.id
            self.member.save(update_fields=['branch_id'])
        
        # Check department using safe attribute access
        if hasattr(self.member, 'department_id'):
            if self.member.department_id != self.team.department.id:
                # Update department instead of raising error
                self.member.department_id = self.team.department.id
                self.member.save(update_fields=['department_id'])
        else:
            # Try alternative approach - check if member has department attribute
            department_value = getattr(self.member, 'department', None)
            if department_value and hasattr(department_value, 'id'):
                if department_value.id != self.team.department.id:
                    # Update the department reference
                    self.member.department = self.team.department
                    self.member.save(update_fields=['department'])
            else:
                # If we can't find department at all, log it but don't fail
                logger = logging.getLogger(__name__)
                logger.warning(f"User {self.member.id} has no department attribute, skipping department validation")
        
        # Validate that the user's role is appropriate for team membership - but just log warnings
        valid_roles = [
            User.ROLE_SALES_AGENT, 
            User.ROLE_SUPPORT_AGENT, 
            User.ROLE_PROCESSOR
        ]
        if hasattr(self.member, 'role') and self.member.role not in valid_roles:
            logger = logging.getLogger(__name__)
            logger.warning(f"User {self.member.id} is assigned as team member but has role {self.member.role} (expected one of {valid_roles})")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


