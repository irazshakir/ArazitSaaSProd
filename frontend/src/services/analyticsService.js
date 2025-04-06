import api from './api';
import { getUser, getUserRole } from '../utils/auth';
import { branchService, departmentService } from './api';

/**
 * Middleware for enforcing tenant isolation in all queries
 * @param {Object} params - Query parameters 
 * @returns {Object} - Parameters with tenant isolation applied
 */
const enforceTenantIsolation = (params = {}) => {
  const tenantId = localStorage.getItem('tenant_id');
  
  if (!tenantId) {
    console.error('No tenant ID found for analytics query');
    throw new Error('Tenant ID is required for data access');
  }
  
  // Always apply tenant_id to every query
  return {
    ...params,
    tenant_id: tenantId
  };
};

/**
 * Apply role-based access filters to queries
 * @param {Object} params - Query parameters 
 * @returns {Object} - Parameters with role-based access controls applied
 */
const applyRoleBasedFilters = (params = {}) => {
  const user = getUser();
  const userRole = getUserRole();
  
  if (!user || !userRole) {
    console.error('User information missing for role-based filtering');
    throw new Error('User information is required for data access');
  }
  
  let updatedParams = { ...params };
  
  // Apply filter based on user role
  switch (userRole) {
    case 'admin':
      // Admin can see all data for the tenant, no additional filters needed
      break;
      
    case 'department_head':
      // Department head can see data for their department
      if (user.department_id) {
        updatedParams.department_id = user.department_id;
      } else {
        console.warn('Department head without department_id');
      }
      break;
      
    case 'manager':
      // Manager can see data for all team leads assigned to them
      updatedParams.manager_id = user.id;
      break;
      
    case 'team_lead':
      // Team lead can see data for all agents assigned to them
      updatedParams.team_lead_id = user.id;
      break;
      
    case 'sales_agent':
    case 'support_agent':
    case 'processor':
      // Agents can only see their own data
      updatedParams.user_id = user.id;
      break;
      
    default:
      // For unknown roles, restrict to user's own data as a safety measure
      updatedParams.user_id = user.id;
      console.warn(`Unknown role ${userRole}, applying default restriction`);
  }
  
  return updatedParams;
};

/**
 * Build a query with all necessary access controls
 * @param {Object} params - Base query parameters
 * @returns {Object} - Parameters with all access controls applied
 */
const buildSecureQuery = (params = {}) => {
  // First enforce tenant isolation
  let secureParams = enforceTenantIsolation(params);
  
  // Then apply role-based filtering
  secureParams = applyRoleBasedFilters(secureParams);
  
  return secureParams;
};

/**
 * Check if user has access to view specific UI elements
 * @param {string} featureKey - Key representing the feature/UI element 
 * @returns {boolean} - Whether user has access to the feature
 */
export const hasFeatureAccess = (featureKey) => {
  const userRole = getUserRole();
  
  // Define permission map for different UI features
  const permissionMap = {
    // Dashboard features
    'dashboard.all_branch_view': ['admin'],
    'dashboard.all_department_view': ['admin', 'department_head'],
    'dashboard.team_performance': ['admin', 'department_head', 'manager', 'team_lead'],
    'dashboard.individual_performance': ['admin', 'department_head', 'manager', 'team_lead', 'sales_agent', 'support_agent', 'processor'],
    
    // Analytics features
    'analytics.export_reports': ['admin', 'department_head'],
    'analytics.lead_source_analysis': ['admin', 'department_head', 'manager'],
    'analytics.conversion_metrics': ['admin', 'department_head', 'manager', 'team_lead'],
    'analytics.team_comparison': ['admin', 'department_head', 'manager'],
    
    // Default permissions
    'default': ['admin']
  };
  
  // Get allowed roles for this feature
  const allowedRoles = permissionMap[featureKey] || permissionMap['default'];
  
  // Check if user's role is in the allowed roles
  return allowedRoles.includes(userRole);
};

/**
 * Analytics Service - provides access to analytics data with proper access controls
 */
const analyticsService = {
  /**
   * Get dashboard summary statistics
   * @param {Object} filters - Optional filters like date range, branch, department
   * @returns {Promise} - Promise resolving to dashboard statistics
   */
  getDashboardStats: async (filters = {}) => {
    try {
      const secureParams = buildSecureQuery(filters);
      const response = await api.get('/analytics/dashboard-stats', { params: secureParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },
  
  /**
   * Get filter options for analytics (branches, departments, users)
   * @returns {Promise} - Promise resolving to filter options
   */
  getFilterOptions: async () => {
    try {
      console.log('Fetching filter options');
      const secureParams = buildSecureQuery();
      console.log('Filter options secure params:', secureParams);
      
      // Try multiple URL formats to find the one that works
      const urls = [
        '/analytics/filter-options',
        '/api/analytics/filter-options',
        '/filter-options'
      ];
      
      let lastError;
      let data;
      
      for (const url of urls) {
        try {
          console.log(`Trying to fetch filter options from: ${url}`);
          const response = await api.get(url, { params: secureParams });
          console.log(`Filter options response from ${url}:`, response.data);
          data = response.data;
          break; // Success, exit the loop
        } catch (error) {
          console.error(`Error fetching filter options from ${url}:`, error);
          lastError = error;
          // Continue trying other URLs
        }
      }
      
      // If we successfully got data, return it
      if (data) {
        return data;
      }
      
      // Otherwise, get branches, departments, and users separately using service functions
      console.log('Trying to fetch filter options using individual service calls');
      
      const tenantId = secureParams.tenant_id;
      
      // Get branches
      let branches = [];
      try {
        branches = await branchService.getBranches(tenantId);
        console.log('Branches from service:', branches);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
      
      // Get departments
      let departments = [];
      try {
        departments = await departmentService.getDepartments(tenantId);
        console.log('Departments from service:', departments);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
      
      // Get users
      let users = [];
      try {
        const userResponse = await api.get('/auth/users/', { params: secureParams });
        users = userResponse.data.results || userResponse.data || [];
        console.log('Users from service:', users);
        
        // Format users to match the expected structure
        users = users.map(user => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`.trim() || user.email
        }));
      } catch (error) {
        console.error('Error fetching users:', error);
      }
      
      // Return the assembled filter options
      const filterOptions = {
        branches,
        departments,
        users
      };
      
      console.log('Assembled filter options:', filterOptions);
      return filterOptions;
      
    } catch (error) {
      console.error('Error fetching filter options:', error);
      console.error('Error details:', error.response?.data || error.message || error);
      
      // Return empty data structure instead of throwing
      return {
        branches: [],
        departments: [],
        users: []
      };
    }
  },
  
  /**
   * Get lead analytics data
   * @param {Object} filters - Optional filters 
   * @returns {Promise} - Promise resolving to lead analytics data
   */
  getLeadAnalytics: async (filters = {}) => {
    try {
      const secureParams = buildSecureQuery(filters);
      const response = await api.get('/analytics/lead-analytics', { params: secureParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching lead analytics:', error);
      throw error;
    }
  },
  
  /**
   * Get paginated leads data for Lead Analytics tab
   * @param {Object} options - Options for pagination and filtering
   * @param {number} options.page - Current page number
   * @param {number} options.pageSize - Number of items per page
   * @param {string} options.status - Filter by lead status
   * @param {string} options.activityStatus - Filter by lead activity status
   * @param {string} options.search - Search term for leads
   * @param {Object} options.dateRange - Date range filters
   * @returns {Promise} - Promise resolving to paginated leads data
   */
  getLeadsTableData: async (options = {}) => {
    try {
      const { page = 1, pageSize = 10, status, activityStatus, search, ...otherFilters } = options;
      
      // Build query parameters
      const params = buildSecureQuery({
        page,
        page_size: pageSize,
        ...otherFilters
      });
      
      // Add optional filters if provided
      if (status) params.status = status;
      if (activityStatus) params.activity_status = activityStatus;
      if (search) params.search = search;
      
      console.log('API request to /analytics/lead-analytics with params:', params);
      
      const response = await api.get('/analytics/lead-analytics', { params });
      console.log('Lead analytics API response:', response.status, response.statusText);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching leads table data:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * Get user performance metrics
   * @param {Object} filters - Optional filters
   * @returns {Promise} - Promise resolving to user performance data
   */
  getUserPerformance: async (filters = {}) => {
    try {
      console.log('Fetching user performance data with filters:', filters);
      const secureParams = buildSecureQuery(filters);
      const response = await api.get('/analytics/user-performance', { params: secureParams });
      console.log('User performance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user performance:', error);
      console.error('Error details:', error.response?.data || error.message || error);
      throw error;
    }
  },
  
  /**
   * Get sales analytics (leads with status='won')
   * @param {Object} filters - Optional filters
   * @returns {Promise} - Promise resolving to sales analytics data
   */
  getSalesAnalytics: async (filters = {}) => {
    try {
      const secureParams = buildSecureQuery(filters);
      const response = await api.get('/analytics/sales-analytics', { params: secureParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
      throw error;
    }
  },
  
  /**
   * Get conversion funnel data
   * @param {Object} filters - Optional filters
   * @returns {Promise} - Promise resolving to conversion funnel data
   */
  getConversionFunnel: async (filters = {}) => {
    try {
      const secureParams = buildSecureQuery(filters);
      const response = await api.get('/analytics/conversion-funnel', { params: secureParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversion funnel:', error);
      throw error;
    }
  },
  
  /**
   * Get marketing analytics data (lead sources with conversion metrics)
   * @param {Object} filters - Optional filters
   * @returns {Promise} - Promise resolving to marketing analytics data
   */
  getMarketingAnalytics: async (filters = {}) => {
    try {
      console.log('Fetching marketing analytics with filters:', filters);
      const secureParams = buildSecureQuery(filters);
      
      // Try the new marketing-analytics endpoint first
      try {
        const response = await api.get('/analytics/marketing-analytics', { params: secureParams });
        console.log('Marketing analytics response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching from marketing-analytics endpoint:', error);
        console.error('Falling back to sales-analytics endpoint');
        
        // Fallback to sales-analytics endpoint for compatibility
        const response = await api.get('/analytics/sales-analytics', { params: secureParams });
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching marketing analytics:', error);
      throw error;
    }
  }
};

export default analyticsService; 