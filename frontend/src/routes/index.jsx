import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import DashboardLayout from '../components/layout/DashboardLayout';

// Auth Pages
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';

// Dashboard Pages
import Dashboard from '../components/dashboard/Dashboard';

// Hajj & Umrah Pages
import HajjPackagesIndex from '../components/hajjPackages/hajjPackagesIndex';

// Testing/Debug Pages
import TestAuthPage from '../components/TestAuthPage';

// Error Handling
import ErrorBoundary from '../components/ErrorBoundary';

// Auth protection HOC
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Test auth page - completely unrestricted */}
        <Route path="/test-auth" element={<TestAuthPage />} />
        
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          
          {/* Hajj & Umrah Routes */}
          <Route path="hajj-umrah">
            <Route path="hajj-packages" element={<HajjPackagesIndex />} />
            {/* Add other hajj-umrah routes here */}
          </Route>
          
          {/* Add other module routes here */}
        </Route>
        
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default AppRoutes; 