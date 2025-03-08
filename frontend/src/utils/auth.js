/**
 * Authentication utility functions for token management
 */

// Get JWT token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Set JWT token in localStorage
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Remove JWT token from localStorage
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken();
  // Add extra debugging
  console.log('isAuthenticated check:', {
    token: token,
    directCheck: localStorage.getItem('token')
  });
  return !!token;
};

// More robust authentication check that checks multiple possible token locations
export const ensureAuthenticated = () => {
  // Check for token in all possible storage locations
  const token = localStorage.getItem('token') || 
                localStorage.getItem('access_token');
  
  // Log what we found for debugging
  console.log('ensureAuthenticated check:', {
    token: token,
    allStorage: {
      token: localStorage.getItem('token'),
      access_token: localStorage.getItem('access_token'),
      user: localStorage.getItem('user')
    }
  });
  
  return !!token;
};

// Get user data from localStorage
export const getUser = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

// Set user data in localStorage
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Remove user data from localStorage
export const removeUser = () => {
  localStorage.removeItem('user');
};

// Get user industry from localStorage
export const getUserIndustry = () => {
  const user = getUser();
  return user?.industry || null;
};

// Log out user by removing all auth data
export const logout = () => {
  removeToken();
  removeUser();
  // Remove any other auth-related data
  localStorage.removeItem('tenant');
  localStorage.removeItem('refreshToken');
}; 