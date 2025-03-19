from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Tenant, TenantUser, Department, Branch


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    """Admin for custom User model."""
    
    list_display = ('email', 'first_name', 'last_name', 'role', 'branch', 'department', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    list_filter = ('is_active', 'role', 'branch', 'department', 'tenant_id')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'phone_number', 'profile_picture')}),
        (_('Tenant info'), {'fields': ('tenant_id', 'is_tenant_owner', 'role', 'branch', 'department')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name'),
        }),
    )


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    """Admin for Branch model."""
    
    list_display = ('name', 'tenant', 'description', 'created_at', 'updated_at')
    search_fields = ('name', 'description', 'tenant__name')
    list_filter = ('tenant', 'created_at')


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    """Admin for Tenant model."""
    
    list_display = ('name', 'domain', 'owner', 'is_active', 'subscription_plan', 'created_at')
    search_fields = ('name', 'domain', 'owner__email')
    list_filter = ('is_active', 'subscription_plan')


@admin.register(TenantUser)
class TenantUserAdmin(admin.ModelAdmin):
    """Admin for TenantUser model."""
    
    list_display = ('user', 'tenant', 'role', 'industry', 'created_at')
    search_fields = ('user__email', 'tenant__name')
    list_filter = ('role', 'industry', 'tenant')


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Admin for Department model."""
    
    list_display = ('name', 'description', 'created_at', 'updated_at')
    search_fields = ('name', 'description')
    list_filter = ('created_at', 'updated_at') 