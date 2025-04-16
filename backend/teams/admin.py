from django.contrib import admin
from .models import Team, TeamManager, TeamLead, TeamMember

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'branch', 'tenant', 'department_head')
    list_filter = ('department', 'branch', 'tenant')
    search_fields = ('name', 'description')

@admin.register(TeamManager)
class TeamManagerAdmin(admin.ModelAdmin):
    list_display = ('manager', 'team')
    list_filter = ('team__department', 'team__branch')
    search_fields = ('manager__email', 'team__name')

@admin.register(TeamLead)
class TeamLeadAdmin(admin.ModelAdmin):
    list_display = ('team_lead', 'manager', 'team')
    list_filter = ('team__department', 'team__branch')
    search_fields = ('team_lead__email', 'manager__manager__email', 'team__name')

@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('member', 'team_lead', 'team', 'is_active')
    list_filter = ('team__department', 'team__branch', 'is_active')
    search_fields = ('member__email', 'team_lead__team_lead__email', 'team__name')
