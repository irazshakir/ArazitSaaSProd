from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
import uuid

class UserManager(BaseUserManager):
    """Define a model manager for User model with no username field."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """Create and save a User with the given email and password."""
        if not email:
            raise ValueError('The given email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular User with the given email and password."""
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        """Create and save a SuperUser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)


class Department(models.Model):
    """Department model for organizational structure."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='departments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.tenant.name}"


class User(AbstractUser):
    """Custom User model for multi-tenancy CRM."""
    
    # User role choices
    ROLE_ADMIN = 'admin'
    ROLE_DEPARTMENT_HEAD = 'department_head'
    ROLE_MANAGER = 'manager'
    ROLE_TEAM_LEAD = 'team_lead'
    ROLE_SALES_AGENT = 'sales_agent'
    ROLE_SUPPORT_AGENT = 'support_agent'
    ROLE_PROCESSOR = 'processor'
    
    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Admin'),
        (ROLE_DEPARTMENT_HEAD, 'Department Head'),
        (ROLE_MANAGER, 'Manager'),
        (ROLE_TEAM_LEAD, 'Team Lead'),
        (ROLE_SALES_AGENT, 'Sales Agent'),
        (ROLE_SUPPORT_AGENT, 'Support Agent'),
        (ROLE_PROCESSOR, 'Processor'),
    ]
    
    username = None
    email = models.EmailField(_('email address'), unique=True)
    
    # Additional fields for user profile
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    
    # Multi-tenancy fields
    tenant_id = models.UUIDField(default=uuid.uuid4, editable=False)
    is_tenant_owner = models.BooleanField(default=False)
    
    # Role field
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_PROCESSOR)
    
    # Department field (nullable for admin and tenant owner)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = UserManager()
    
    def __str__(self):
        return self.email


class Tenant(models.Model):
    """Tenant model for multi-tenancy."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    domain = models.CharField(max_length=100, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_tenants')
    
    # Subscription related fields
    is_active = models.BooleanField(default=True)
    subscription_plan = models.CharField(max_length=50, default='free')
    subscription_start_date = models.DateTimeField(auto_now_add=True)
    subscription_end_date = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return self.name


class TenantUser(models.Model):
    """Model to associate users with tenants."""
    
    # Industry choices
    INDUSTRY_HAJJ_UMRAH = 'hajj_umrah'
    INDUSTRY_TRAVEL_TOURISM = 'travel_tourism'
    INDUSTRY_IMMIGRATION = 'immigration'
    INDUSTRY_REAL_ESTATE = 'real_estate'
    INDUSTRY_ECOMMERCE = 'ecommerce'
    
    INDUSTRY_CHOICES = [
        (INDUSTRY_HAJJ_UMRAH, 'Hajj and Umrah'),
        (INDUSTRY_TRAVEL_TOURISM, 'Travel and Tourism'),
        (INDUSTRY_IMMIGRATION, 'Immigration Consultancy'),
        (INDUSTRY_REAL_ESTATE, 'Real Estate'),
        (INDUSTRY_ECOMMERCE, 'Ecommerce'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tenant_users')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='users')
    role = models.CharField(max_length=50, default='member')
    industry = models.CharField(max_length=50, choices=INDUSTRY_CHOICES, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'tenant')
        
    def __str__(self):
        return f"{self.user.email} - {self.tenant.name} ({self.role})" 