import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

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
    const response = await api.post('/auth/token/', { email, password });
    
    // The backend now returns user data directly in the response
    const userData = response.data.user || { email };
    
    // Store complete user data including industry
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