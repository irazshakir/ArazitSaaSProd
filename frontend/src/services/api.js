import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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
    
    // Log all user data properties to debug
    console.log('Raw user data from token response:', response.data);
    console.log('User data properties:', Object.keys(userData));
    
    // Check if tenant_id exists in user data
    if (userData.tenant_id) {
      console.log('Found tenant_id in user data:', userData.tenant_id);
    } else {
      console.warn('tenant_id not found in user data from token response');
    }
    
    // If no user data from token response, fetch user details
    if (!userData.id) {
      try {
        // Set token to make authenticated requests
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        
        // Get user details
        const userResponse = await api.get('/auth/me/');
        Object.assign(userData, userResponse.data);
        
        console.log('Retrieved user data:', userData);
      } catch (err) {
        console.error('Error fetching user details:', err);
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
          
          console.log('User tenant information:', {
            tenant_id: userData.tenant_id,
            role: userData.tenant_role
          });
          
          // Store current tenant in session storage
          sessionStorage.setItem('currentTenant', JSON.stringify(userData.tenant_details));
        }
      }
    } catch (err) {
      console.error('Error fetching tenant data:', err);
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
    const response = await api.get('/users/');
    return response.data;
  },

  // Get user by ID
  getUser: async (id) => {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  },

  // Create user
  createUser: async (userData) => {
    const response = await api.post('/users/', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}/`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}/`);
    return response.data;
  }
};

// Department service
export const departmentService = {
  // Get all departments
  getDepartments: async () => {
    const response = await api.get('/departments/');
    return response.data;
  },

  // Get department by ID
  getDepartment: async (id) => {
    const response = await api.get(`/departments/${id}/`);
    return response.data;
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

export default api; 