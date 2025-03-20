from django.contrib import admin
from .models import Team, TeamMember, DepartmentHead

class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 1
    autocomplete_fields = ['user']

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant', 'branch', 'department', 'team_lead', 'manager', 'created_at')
    list_filter = ('tenant', 'branch', 'department')
    search_fields = ('name', 'team_lead__email', 'manager__email')
    autocomplete_fields = ['tenant', 'branch', 'department', 'team_lead', 'manager']
    inlines = [TeamMemberInline]
    
    def get_queryset(self, request):
        """Filter teams based on user's tenant"""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(tenant_id=request.user.tenant_id)
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Filter options in foreign key fields"""
        if not request.user.is_superuser:
            if db_field.name == "tenant":
                kwargs["queryset"] = db_field.related_model.objects.filter(id=request.user.tenant_id)
            elif db_field.name == "branch":
                kwargs["queryset"] = db_field.related_model.objects.filter(tenant_id=request.user.tenant_id)
            elif db_field.name in ["team_lead", "manager"]:
                kwargs["queryset"] = db_field.related_model.objects.filter(tenant_id=request.user.tenant_id)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'team', 'joined_at', 'is_active')
    list_filter = ('team__tenant', 'team__branch', 'team__department', 'is_active')
    search_fields = ('user__email', 'team__name')
    autocomplete_fields = ['team', 'user']
    
    def get_queryset(self, request):
        """Filter team members based on user's tenant"""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(team__tenant_id=request.user.tenant_id)
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Filter options in foreign key fields"""
        if not request.user.is_superuser:
            if db_field.name == "team":
                kwargs["queryset"] = db_field.related_model.objects.filter(tenant_id=request.user.tenant_id)
            elif db_field.name == "user":
                kwargs["queryset"] = db_field.related_model.objects.filter(tenant_id=request.user.tenant_id)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(DepartmentHead)
class DepartmentHeadAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'branch', 'tenant', 'appointed_at', 'is_active')
    list_filter = ('tenant', 'branch', 'department', 'is_active')
    search_fields = ('user__email', 'department__name', 'branch__name')
    autocomplete_fields = ['tenant', 'branch', 'department', 'user']
    
    def get_queryset(self, request):
        """Filter department heads based on user's tenant"""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(tenant_id=request.user.tenant_id)
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Filter options in foreign key fields"""
        if not request.user.is_superuser:
            if db_field.name == "tenant":
                kwargs["queryset"] = db_field.related_model.objects.filter(id=request.user.tenant_id)
            elif db_field.name == "branch":
                kwargs["queryset"] = db_field.related_model.objects.filter(tenant_id=request.user.tenant_id)
            elif db_field.name == "user":
                kwargs["queryset"] = db_field.related_model.objects.filter(
                    tenant_id=request.user.tenant_id,
                    role=db_field.related_model.ROLE_DEPARTMENT_HEAD
                )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
