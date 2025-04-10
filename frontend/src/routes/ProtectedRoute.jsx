import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getToken, ensureAuthenticated } from '../utils/auth';

/**
 * ProtectedRoute - Higher-order component that protects routes from unauthorized access
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  
  // Use the more robust check
  const isAuth = ensureAuthenticated();

  if (!isAuth) {
    // Redirect to login page with a return path
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute; 