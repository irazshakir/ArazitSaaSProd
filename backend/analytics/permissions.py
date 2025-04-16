from rest_framework import permissions

class AnalyticsPermission(permissions.BasePermission):
    """
    Custom permission for analytics views:
    - Admin can view all data for their tenant
    - Department Head can view all data for their department
    - Manager can view data for team leads and agents under them
    - Team Lead can view data for agents in their team
    - Agents can only view their own data
    """
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
            
        # Check if tenant_id is present
        tenant_id = request.query_params.get('tenant_id')
        if not tenant_id and not request.user.tenant_id:
            return False
            
        # User must have one of the allowed roles
        allowed_roles = ['admin', 'department_head', 'manager', 'team_lead', 'sales_agent', 'support_agent', 'processor']
        user_role = request.user.role
        
        if user_role not in allowed_roles:
            return False
            
        return True
