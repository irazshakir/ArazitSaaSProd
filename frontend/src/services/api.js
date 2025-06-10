import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Use the API_BASE_URL from environment, with proper fallback
const API_URL = import.meta.env.VITE_API_BASE_URL || API_BASE_URL;

// Create axios instance with proper base URL configuration
const api = axios.create({
  baseURL: API_URL,  // Base URL without /api prefix
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    // Check multiple possible token locations
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('access_token');
    
    // Use the token that exists
    const authToken = token || accessToken;
    
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    // Get current tenant from session storage
    const currentTenant = sessionStorage.getItem('currentTenant');
    if (currentTenant) {
      try {
        const tenant = JSON.parse(currentTenant);
        config.headers['X-Tenant-ID'] = tenant.id;
      } catch (e) {
        console.error('Error parsing current tenant:', e);
      }
    }
    
    // Get CSRF token from cookie if it exists
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
      
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    
    // Ensure URL has leading slash
    if (!config.url.startsWith('/')) {
      config.url = `/${config.url}`;
    }
    
    // Ensure URL starts with /api/ unless it's already there
    if (!config.url.startsWith('/api/')) {
      config.url = `/api${config.url}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Check if we're already on the login page to avoid redirect loops
      if (!window.location.pathname.includes('/login')) {
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Redirect to login
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication service
export const authService = {
  // Login user
  login: async (email, password) => {
    try {
      console.log('Login attempt with:', { email, password: '***' });
      console.log('API URL:', API_URL);
      
      // Get the authentication token using email and password
      const response = await api.post('/api/auth/token/', { 
        email: email,
        password: password
      });
      
      console.log('Login response:', response.data);
      
      // Extract user data from response
      const userData = response.data.user || { email };
      
      // If no user data from token response, fetch user details
      if (!userData.id) {
        try {
          // Set token to make authenticated requests
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
          
          // Get user details
          const userResponse = await api.get('/api/auth/me/');
          Object.assign(userData, userResponse.data);
        } catch (err) {
          console.error('Error fetching user details:', err);
        }
      }
      
      // Try to get tenant information for the user
      try {
        if (userData.id) {
          const tenantsResponse = await api.get('/api/auth/user-tenants/');
          
          if (tenantsResponse.data && Array.isArray(tenantsResponse.data) && tenantsResponse.data.length > 0) {
            userData.tenant_id = tenantsResponse.data[0].tenant.id;
            userData.tenant_details = tenantsResponse.data[0].tenant;
            userData.tenant_role = tenantsResponse.data[0].role;
            
            // Store current tenant in session storage
            sessionStorage.setItem('currentTenant', JSON.stringify(userData.tenant_details));
          }
        }
      } catch (err) {
        console.error('Error fetching tenant information:', err);
      }
      
      return {
        token: response.data.access,
        refreshToken: response.data.refresh,
        user: userData
      };
    } catch (error) {
      console.error('Login error details:', error.response?.data);
      throw error;
    }
  },

  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

// User service
export const userService = {
  // Get all users
  getUsers: async () => {
    const response = await api.get('/auth/users/');
    return response.data;
  },

  // Get user by ID
  getUser: async (id) => {
    const response = await api.get(`/auth/users/${id}/`);
    return response.data;
  },

  // Create user
  createUser: async (userData) => {
    const response = await api.post('/auth/users/', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/auth/users/${id}/`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/auth/users/${id}/`);
    return response.data;
  }
};

// Department service
export const departmentService = {
  // Get all departments
  getDepartments: async (tenantId) => {
    try {
      const params = tenantId ? { tenant: tenantId } : {};
      
      // Use the correct endpoint from the backend URLs
      const response = await api.get('/auth/departments/', { params });
      
      // Ensure we return an array
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Check if it's a paginated response
        if (Array.isArray(response.data.results)) {
          return response.data.results;
        } else {
          // Try to convert object to array if possible
          return Object.values(response.data);
        }
      }
      
      // If none of the above, return empty array
      return [];
      
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  // Get department by ID
  getDepartment: async (id) => {
    const response = await api.get(`/auth/departments/${id}/`);
    return response.data;
  },

  // Create department
  createDepartment: async (departmentData) => {
    const response = await api.post('/auth/departments/', departmentData);
    return response.data;
  },

  // Update department
  updateDepartment: async (id, departmentData) => {
    const response = await api.put(`/auth/departments/${id}/`, departmentData);
    return response.data;
  },

  // Delete department
  deleteDepartment: async (id) => {
    const response = await api.delete(`/auth/departments/${id}/`);
    return response.data;
  }
};

// Branch service
export const branchService = {
  // Get all branches
  getBranches: async (tenantId) => {
    if (!tenantId) {
      throw new Error('Tenant ID is required to fetch branches');
    }
    
    try {
      const response = await api.get('/auth/branches/', { 
        params: { tenant: tenantId }
      });
      
      return Array.isArray(response.data) ? response.data : 
             (response.data?.results || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  },

  // Get branch by ID
  getBranch: async (id, tenantId) => {
    if (!tenantId) {
      throw new Error('Tenant ID is required to fetch branch details');
    }
    
    const response = await api.get(`/auth/branches/${id}/`, {
      params: { tenant: tenantId }
    });
    
    return response.data;
  },

  // Create branch
  createBranch: async (branchData) => {
    if (!branchData.tenant) {
      throw new Error('Tenant ID is required to create branch');
    }
    
    const response = await api.post('/auth/branches/', branchData);
    
    return response.data;
  },

  // Update branch
  updateBranch: async (id, branchData) => {
    if (!branchData.tenant) {
      throw new Error('Tenant ID is required to update branch');
    }
    
    const response = await api.put(`/auth/branches/${id}/`, branchData);
    
    return response.data;
  },

  // Delete branch
  deleteBranch: async (id, tenantId) => {
    if (!tenantId) {
      throw new Error('Tenant ID is required to delete branch');
    }
    
    const response = await api.delete(`/auth/branches/${id}/`, {
      params: { tenant: tenantId }
    });
    
    return response.data;
  }
};

// Lead service
export const leadService = {
  // Get leads with role-based filtering
  getLeadsByRole: async (params) => {
    try {
      const response = await api.get('/leads/by-role/', { params });
      return response.data;
    } catch (error) {
      // If 404, fall back to the main leads endpoint
      if (error.response && error.response.status === 404) {
        const fallbackResponse = await api.get('/leads/', { params });
        return fallbackResponse.data;
      }
      throw error;
    }
  },
  
  // Get all leads
  getLeads: async (params) => {
    const response = await api.get('/leads/', { params });
    return response.data;
  },
  
  // Get lead by ID
  getLead: async (id) => {
    const response = await api.get(`/leads/${id}/`);
    return response.data;
  },
  
  // Create lead
  createLead: async (leadData) => {
    const response = await api.post('/leads/', leadData);
    return response.data;
  },
  
  // Update lead
  updateLead: async (id, leadData) => {
    const response = await api.put(`/leads/${id}/`, leadData);
    return response.data;
  },
  
  // Delete lead
  deleteLead: async (id) => {
    const response = await api.delete(`/leads/${id}/`);
    return response.data;
  }
};

export default api; 