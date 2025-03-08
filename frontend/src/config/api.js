/**
 * API configuration settings
 */

// Base URL for API requests
// In Vite, environment variables are accessed via import.meta.env and prefixed with VITE_
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Default request timeout in milliseconds
export const API_TIMEOUT = 30000;

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/token/',
    REFRESH: '/api/auth/token/refresh/',
    REGISTER: '/api/auth/users/register/',
    ME: '/api/auth/users/me/',
  },
  
  // Hajj Packages endpoints
  HAJJ_PACKAGES: {
    LIST: '/api/hajj-packages/',
    DETAIL: (id) => `/api/hajj-packages/${id}/`,
    ACTIVE: '/api/hajj-packages/active/',
    ASSIGN: (id) => `/api/hajj-packages/${id}/assign/`,
  },
  
  // Add other endpoints as needed for different package types
}; 