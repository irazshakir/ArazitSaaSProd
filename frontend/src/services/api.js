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
    // Check multiple possible token locations
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('access_token');
    
    // Log what we found
    console.log('API Interceptor - Token check:', {
      token,
      accessToken,
      configUrl: config.url
    });
    
    // Use the token that exists
    const authToken = token || accessToken;
    
    if (authToken) {
      console.log('API Interceptor - Setting Authorization header:', `Bearer ${authToken}`);
      config.headers.Authorization = `Bearer ${authToken}`;
    } else {
      console.warn('API Interceptor - No token found in storage');
    }
    
    return config;
  },
  (error) => {
    console.error('API Interceptor - Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`API Response [${response.status}] for ${response.config.url}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data ? 'Data received' : 'No data'
    });
    return response;
  },
  (error) => {
    // Log detailed error information
    console.error('API Error Response:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
      data: error.response?.data
    });
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error('401 Unauthorized Error - Token details:', {
        token: localStorage.getItem('token'),
        accessToken: localStorage.getItem('access_token'),
        authHeader: error.config?.headers?.Authorization
      });
      
      // Check if we're already on the login page to avoid redirect loops
      if (!window.location.pathname.includes('/login')) {
        console.log('Redirecting to login page due to 401 error');
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