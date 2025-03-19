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
import HajjPackageCreate from '../components/forms/products/hajjPackages/HajjPackageCreate';
import HajjPackageEdit from '../components/forms/products/hajjPackages/HajjPackageEdit';

// Leads Pages
import LeadsIndex from '../components/leads/leadsIndex';
import LeadCreate from '../components/leads/LeadCreate';
import LeadEdit from '../components/leads/leadEdit';
import LeadView from '../components/leads/leadView';

// Testing/Debug Pages
import TestAuthPage from '../components/TestAuthPage';

// Error Handling
import ErrorBoundary from '../components/ErrorBoundary';

// Auth protection HOC
import ProtectedRoute from './ProtectedRoute';

// User Management Pages
import UserIndex from '../components/users/userIndex';
import UserCreate from '../components/users/userCreate';
import UserEdit from '../components/users/userEdit';

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
            <Route path="hajj-packages/create" element={<HajjPackageCreate />} />
            <Route path="hajj-packages/:id/edit" element={<HajjPackageEdit />} />
            {/* Add other hajj-umrah routes here */}
          </Route>
          
          {/* User Management Routes */}
          <Route path="users" element={<UserIndex />} />
          <Route path="users/create" element={<UserCreate />} />
          <Route path="users/:id/edit" element={<UserEdit />} />
          
          {/* Leads Routes */}
          <Route path="leads" element={<LeadsIndex />} />
          <Route path="leads/create" element={<LeadCreate />} />
          <Route path="leads/:id" element={<LeadView />} />
          <Route path="leads/:id/edit" element={<LeadEdit />} />
          
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