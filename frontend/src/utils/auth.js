/**
 * Authentication utility functions for token management
 */

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Set token to localStorage
const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Remove token from localStorage
const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
};

// Set userData to localStorage
const setUserData = (userData) => {
  const stringifiedData = JSON.stringify(userData);
  localStorage.setItem('userData', stringifiedData);
};

// Get userData from localStorage
const getUserData = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};

// Check if user is authenticated
const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

// More robust authentication check - checks if token exists and is not expired
const ensureAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  // Check if token is expired
  return !isTokenExpired(token);
};

// Check if user has admin role
const isAdmin = () => {
  const userData = getUserData();
  return userData && userData.role === 'admin';
};

// Check if user has specific role
const hasRole = (role) => {
  const userData = getUserData();
  return userData && userData.role === role;
};

// Utility function to check if a token is expired
const isTokenExpired = (token) => {
  try {
    if (!token) return true;
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
    return Date.now() > expirationTime;
  } catch (error) {
    return true;
  }
};

// Check if current token is expired
const isCurrentTokenExpired = () => {
  const token = getToken();
  return isTokenExpired(token);
};

// Get user data from localStorage
const getUser = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

// Set user data in localStorage
const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Remove user data from localStorage
const removeUser = () => {
  localStorage.removeItem('user');
};

// Get user industry from localStorage
const getUserIndustry = () => {
  const user = getUser();
  return user?.industry || null;
};

// Get user role from localStorage
const getUserRole = () => {
  return localStorage.getItem('user_role');
};

// Check if user has any of the specified roles
const hasAnyRole = (roles) => {
  const userRole = getUserRole();
  return roles.includes(userRole);
};

// Enhanced logout to clear role
const logout = () => {
  removeToken();
  removeUser();
  localStorage.removeItem('tenant_id');
  localStorage.removeItem('user_role');
  localStorage.removeItem('refreshToken');
};

// In your login success handler function
const handleLoginSuccess = (userData, token) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
  
  // Store tenant_id
  if (userData.tenant_id) {
    localStorage.setItem('tenant_id', userData.tenant_id);
  }
  
  // Store department_id - make sure this is set
  if (userData.department_id) {
    localStorage.setItem('department_id', userData.department_id);
  }
  
  // Store role
  if (userData.role) {
    localStorage.setItem('role', userData.role);
  }
};

export {
  getToken,
  setToken,
  removeToken,
  setUserData,
  getUserData,
  isAuthenticated,
  ensureAuthenticated,
  isAdmin,
  hasRole,
  isTokenExpired,
  isCurrentTokenExpired,
  getUser,
  setUser,
  removeUser,
  getUserIndustry,
  getUserRole,
  hasAnyRole,
  logout,
  handleLoginSuccess
}; 