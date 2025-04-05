import api from './api';
import { getUser, getUserRole } from '../utils/auth';

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
   * Get user performance metrics
   * @param {Object} filters - Optional filters
   * @returns {Promise} - Promise resolving to user performance data
   */
  getUserPerformance: async (filters = {}) => {
    try {
      const secureParams = buildSecureQuery(filters);
      const response = await api.get('/analytics/user-performance', { params: secureParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching user performance:', error);
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
  }
};

export default analyticsService; 