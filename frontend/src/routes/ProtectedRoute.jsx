import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getToken, ensureAuthenticated } from '../utils/auth';

/**
 * ProtectedRoute - Higher-order component that protects routes from unauthorized access
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  
  // Add debugging to see what's happening
  useEffect(() => {
    const token = getToken();
    console.log('ProtectedRoute - Token:', token);
    console.log('ProtectedRoute - isAuthenticated:', !!token);
    console.log('ProtectedRoute - Location:', location.pathname);
    
    // Check what's in localStorage directly
    console.log('ProtectedRoute - localStorage:', {
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user')
    });
  }, [location.pathname]);
  
  // Use the more robust check
  const isAuth = ensureAuthenticated();

  if (!isAuth) {
    // Redirect to login page with a return path
    console.log('ProtectedRoute - Redirecting to login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute; 