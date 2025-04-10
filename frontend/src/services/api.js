import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CSRF cookies
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
    
    // Get CSRF token from cookie if it exists
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
      
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
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
    // Get the authentication token
    const response = await api.post('/auth/token/', { email, password });
    
    // Extract user data from response
    const userData = response.data.user || { email };
    
    // If no user data from token response, fetch user details
    if (!userData.id) {
      try {
        // Set token to make authenticated requests
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        
        // Get user details
        const userResponse = await api.get('/auth/me/');
        Object.assign(userData, userResponse.data);
      } catch (err) {
        // Handle error silently
      }
    }
    
    // Try to get tenant information for the user
    try {
      if (userData.id) {
        // Try to get user tenants
        const tenantsResponse = await api.get('/auth/user-tenants/');
        
        if (tenantsResponse.data && Array.isArray(tenantsResponse.data) && tenantsResponse.data.length > 0) {
          // Add first tenant to user data
          userData.tenant_id = tenantsResponse.data[0].tenant.id;
          userData.tenant_details = tenantsResponse.data[0].tenant;
          userData.tenant_role = tenantsResponse.data[0].role;
          
          // Store current tenant in session storage
          sessionStorage.setItem('currentTenant', JSON.stringify(userData.tenant_details));
        }
      }
    } catch (err) {
      // Handle error silently
    }
    
    // Return complete user data
    return {
      token: response.data.access,
      refreshToken: response.data.refresh,
      user: userData
    };
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
      
      // Try these endpoints in order
      const endpoints = [
        '/departments/',
        '/auth/departments/',
        '/users/departments/'
      ];
      
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint, { params });
          
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
          lastError = error;
          // Only continue if it's a 404
          if (error.response && error.response.status !== 404) {
            throw error;
          }
        }
      }
      
      // If we get here, all endpoints failed
      throw lastError;
    } catch (error) {
      throw error;
    }
  },

  // Get department by ID
  getDepartment: async (id) => {
    try {
      const response = await api.get(`/departments/${id}/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        const authResponse = await api.get(`/auth/departments/${id}/`);
        return authResponse.data;
      }
      throw error;
    }
  },

  // Create department
  createDepartment: async (departmentData) => {
    const response = await api.post('/departments/', departmentData);
    return response.data;
  },

  // Update department
  updateDepartment: async (id, departmentData) => {
    const response = await api.put(`/departments/${id}/`, departmentData);
    return response.data;
  },

  // Delete department
  deleteDepartment: async (id) => {
    const response = await api.delete(`/departments/${id}/`);
    return response.data;
  }
};

// Branch service
export const branchService = {
  // Get all branches
  getBranches: async (tenantId) => {
    try {
      const params = tenantId ? { tenant: tenantId } : {};
      
      // Try these endpoints in order
      const endpoints = [
        '/branches/',
        '/auth/branches/',
        '/users/branches/'
      ];
      
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint, { params });
          
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
          lastError = error;
          // Only continue if it's a 404
          if (error.response && error.response.status !== 404) {
            throw error;
          }
        }
      }
      
      // If we get here, all endpoints failed
      throw lastError;
    } catch (error) {
      throw error;
    }
  },

  // Get branch by ID
  getBranch: async (id) => {
    try {
      const response = await api.get(`/users/branches/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create branch
  createBranch: async (branchData) => {
    const response = await api.post('/users/branches/', branchData);
    return response.data;
  },

  // Update branch
  updateBranch: async (id, branchData) => {
    const response = await api.put(`/users/branches/${id}/`, branchData);
    return response.data;
  },

  // Delete branch
  deleteBranch: async (id) => {
    const response = await api.delete(`/users/branches/${id}/`);
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