/**
 * Data Access Service - Controls what data users can access based on their role and team structure
 */

import { getUserRole } from '../utils/auth';
import api from '../services/api';

// Class to manage data access permissions
class DataAccessService {
  constructor() {
    // Use userRole from auth service directly
    this.role = getUserRole();
    this.tenantId = localStorage.getItem('tenant_id');
    
    // Get user data from localStorage and extract department ID
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      this.departmentId = userData.department_id;
      this.userId = userData.id;
    } catch (error) {
      this.departmentId = localStorage.getItem('department_id');
      this.userId = null;
    }
    
    // Cache for team structure data
    this.teamCache = {
      teamIds: null,
      managedUserIds: null,
      teamLeadUserIds: null,
      teamMemberUserIds: null,
      lastFetched: null
    };
  }

  _getUserId() {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        return JSON.parse(user).id;
      } catch (error) {
        return null;
      }
    }
    return null;
  }
  
  // Get access level for the current user
  getAccessLevel() {
    switch (this.role) {
      case 'admin':
        return 'tenant'; // Access to all data within tenant
      case 'department_head':
        return 'department'; // Access to all data within department
      case 'manager':
        return 'manager_team'; // Access to data for teams under management
      case 'team_lead':
        return 'team'; // Access to data for team members
      case 'sales_agent':
      case 'support_agent':
      case 'processor':
      default:
        return 'individual'; // Access only to own data
    }
  }
  
  // Fetch and cache team hierarchy data for the current user
  async fetchTeamHierarchy() {
    // Check if we have cached data that's less than 5 minutes old
    const now = new Date();
    if (
      this.teamCache.lastFetched && 
      (now - this.teamCache.lastFetched) < 5 * 60 * 1000 &&
      this.teamCache.teamIds !== null
    ) {
      return;
    }
    
    try {
      const accessLevel = this.getAccessLevel();
      
      // Different endpoints based on role
      let endpoint = '';
      
      switch (accessLevel) {
        case 'tenant':
          // Admin - no specific filtering needed, but might want to cache all team data
          endpoint = '/teams/';
          break;
          
        case 'department':
          // Department head - get all teams in their department
          endpoint = `/departments/${this.departmentId}/teams/`;
          break;
          
        case 'manager_team':
          // Manager - get teams they manage
          endpoint = `/teams/manager/${this.userId}/hierarchy/`;
          break;
          
        case 'team':
          // Team lead - get their team members
          endpoint = `/teams/team-lead/${this.userId}/members/`;
          break;
          
        default:
          // For individual users, we don't need to fetch team hierarchy
          this.teamCache.lastFetched = now;
          return;
      }
      
      const response = await api.get(endpoint);
      
      // Process and cache the response based on role
      if (accessLevel === 'tenant' || accessLevel === 'department') {
        // For admin and department head, cache all team IDs
        this.teamCache.teamIds = response.data.map(team => team.id);
        
        // Also collect all managed users by going through team hierarchy
        const allManagedUsers = new Set();
        const allTeamLeadUsers = new Set();
        const allTeamMemberUsers = new Set();
        
        // Process each team's hierarchy
        for (const team of response.data) {
          // Collect managers
          if (team.managers) {
            team.managers.forEach(manager => {
              allManagedUsers.add(manager.manager);
              
              // Process team leads under each manager
              if (manager.team_leads) {
                manager.team_leads.forEach(teamLead => {
                  allTeamLeadUsers.add(teamLead.team_lead);
                  
                  // Process team members under each team lead
                  if (teamLead.members) {
                    teamLead.members.forEach(member => {
                      allTeamMemberUsers.add(member.member);
                    });
                  }
                });
              }
            });
          }
        }
        
        this.teamCache.managedUserIds = Array.from(allManagedUsers);
        this.teamCache.teamLeadUserIds = Array.from(allTeamLeadUsers);
        this.teamCache.teamMemberUserIds = Array.from(allTeamMemberUsers);
      } 
      else if (accessLevel === 'manager_team') {
        // For managers, we get their managed teams with team leads and members
        this.teamCache.teamIds = response.data.map(team => team.id);
        this.teamCache.teamLeadUserIds = [];
        this.teamCache.teamMemberUserIds = [];
        
        // Collect team lead and member IDs
        response.data.forEach(team => {
          if (team.team_leads) {
            team.team_leads.forEach(teamLead => {
              this.teamCache.teamLeadUserIds.push(teamLead.team_lead);
              
              if (teamLead.members) {
                teamLead.members.forEach(member => {
                  this.teamCache.teamMemberUserIds.push(member.member);
                });
              }
            });
          }
        });
      } 
      else if (accessLevel === 'team') {
        // For team leads, we just get their team members
        this.teamCache.teamMemberUserIds = response.data.map(member => member.member);
      }
      
      this.teamCache.lastFetched = now;
    } catch (error) {
      // Reset cache on error
      this.teamCache = {
        teamIds: null,
        managedUserIds: null,
        teamLeadUserIds: null,
        teamMemberUserIds: null,
        lastFetched: null
      };
    }
  }
  
  // Get query parameters to filter API requests based on user role
  async getQueryParams() {
    const accessLevel = this.getAccessLevel();
    const params = { tenant_id: this.tenantId };
    
    // For hierarchical data, ensure team structure is loaded
    if (accessLevel !== 'individual' && accessLevel !== 'tenant') {
      await this.fetchTeamHierarchy();
    }
    
    switch (accessLevel) {
      case 'tenant':
        // Admin level - just filter by tenant_id
        return params;
      
      case 'department':
        // Department head level - filter by department
        if (!this.departmentId) {
          // Removed console.warn
        }
        return {
          ...params,
          department: this.departmentId
        };
      
      case 'manager_team':
        // Manager level - filter by teams they manage and users under them
        return {
          ...params,
          team_ids: this.teamCache.teamIds,
          user_ids: [
            this.userId, // Include the manager's own items
            ...(this.teamCache.teamLeadUserIds || []),
            ...(this.teamCache.teamMemberUserIds || [])
          ]
        };
      
      case 'team':
        // Team lead level - filter by team members under them
        return {
          ...params,
          user_ids: [
            this.userId, // Include the team lead's own items
            ...(this.teamCache.teamMemberUserIds || [])
          ]
        };
      
      case 'individual':
      default:
        // Individual level - filter by assigned_to
        return {
          ...params,
          assigned_to: this.userId
        };
    }
  }
  
  // Helper method to filter API response data client-side
  async filterData(data, entityType) {
    const accessLevel = this.getAccessLevel();
    
    // For admin, no filtering necessary
    if (accessLevel === 'tenant') {
      return data;
    }
    
    // Ensure team hierarchy is loaded for role-based filtering
    if (accessLevel !== 'individual') {
      await this.fetchTeamHierarchy();
    }
    
    // Filter logic depends on entity type and access level
    switch (entityType) {
      case 'leads':
        return this._filterLeads(data, accessLevel);
      case 'chats':
        return this._filterChats(data, accessLevel);
      // Add more entity types as needed
      default:
        return data;
    }
  }
  
  // Private methods for specific entity filtering
  _filterLeads(leads, accessLevel) {
    switch (accessLevel) {
      case 'department':
        return leads.filter(lead => {
          // Try multiple possible department field names
          const leadDept = lead.department || lead.department_id || 
                           (lead.department_details ? lead.department_details.id : null);
          
          return leadDept && (
            String(leadDept) === String(this.departmentId) || 
            (lead.department_details && String(lead.department_details.id) === String(this.departmentId))
          );
        });
        
      case 'manager_team': {
        // Filter leads assigned to team members under this manager
        const allowedUserIds = [
          this.userId,
          ...(this.teamCache.teamLeadUserIds || []),
          ...(this.teamCache.teamMemberUserIds || [])
        ];
        
        return leads.filter(lead => {
          return allowedUserIds.includes(lead.assigned_to);
        });
      }
      
      case 'team': {
        // Filter leads assigned to team members under this team lead
        const allowedUserIds = [
          this.userId,
          ...(this.teamCache.teamMemberUserIds || [])
        ];
        
        return leads.filter(lead => {
          return allowedUserIds.includes(lead.assigned_to);
        });
      }
      
      case 'individual':
        // Filter leads assigned to this user
        return leads.filter(lead => lead.assigned_to === this.userId);
      
      default:
        return leads;
    }
  }
  
  _filterChats(chats, accessLevel) {
    // Apply similar logic as _filterLeads but for chats
    // Will need to adjust based on your chat data structure
    switch (accessLevel) {
      case 'department':
        return chats.filter(chat => chat.department_id === this.departmentId);
      
      case 'manager_team': {
        const allowedUserIds = [
          this.userId,
          ...(this.teamCache.teamLeadUserIds || []),
          ...(this.teamCache.teamMemberUserIds || [])
        ];
        
        return chats.filter(chat => {
          return allowedUserIds.includes(chat.assigned_to);
        });
      }
      
      case 'team': {
        const allowedUserIds = [
          this.userId,
          ...(this.teamCache.teamMemberUserIds || [])
        ];
        
        return chats.filter(chat => {
          return allowedUserIds.includes(chat.assigned_to);
        });
      }
      
      case 'individual':
        return chats.filter(chat => chat.assigned_to === this.userId);
      
      default:
        return chats;
    }
  }

  // Get tenant ID from storage
  getTenantId() {
    // Return cached tenant ID if available
    if (this.tenantId) {
      return this.tenantId;
    }
    
    // Try to get from localStorage
    const storedTenantId = localStorage.getItem('tenant_id');
    if (storedTenantId) {
      this.tenantId = storedTenantId;
      return storedTenantId;
    }
    
    // Try to extract from user data
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.tenant_id) {
        this.tenantId = userData.tenant_id;
        return userData.tenant_id;
      }
    } catch (error) {
      // Removed console.error
    }
    
    return null;
  }
}

export default new DataAccessService(); 