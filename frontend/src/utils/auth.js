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

// Get user role from localStorage
export const getUserRole = () => {
  return localStorage.getItem('user_role');
};

// Check if user has specific role
export const hasRole = (requiredRole) => {
  const userRole = getUserRole();
  return userRole === requiredRole;
};

// Check if user has any of the specified roles
export const hasAnyRole = (roles) => {
  const userRole = getUserRole();
  return roles.includes(userRole);
};

// Enhanced logout to clear role
export const logout = () => {
  removeToken();
  removeUser();
  localStorage.removeItem('tenant_id');
  localStorage.removeItem('user_role');
  localStorage.removeItem('refreshToken');
};

// In your login success handler function
export const handleLoginSuccess = (userData, token) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
  
  // Store tenant_id
  if (userData.tenant_id) {
    localStorage.setItem('tenant_id', userData.tenant_id);
  }
  
  // Store department_id - make sure this is set
  if (userData.department_id) {
    localStorage.setItem('department_id', userData.department_id);
    console.log('Stored department_id in localStorage:', userData.department_id);
  } else {
    console.warn('No department_id available in user data');
  }
  
  // Store role
  if (userData.role) {
    localStorage.setItem('role', userData.role);
  }
}; 