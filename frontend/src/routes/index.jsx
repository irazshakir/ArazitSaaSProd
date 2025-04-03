import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import DashboardLayout from '../components/layout/DashboardLayout';

// Auth Pages
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';

// Dashboard Pages
import Dashboard from '../components/dashboard/Dashboard';

// Analytics Pages
import AnalyticalReport from '../components/analytics/analyticalReport';
import PerformanceReport from '../components/analytics/performanceReport';

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

// Teams Pages
import TeamsIndex from '../components/teams/teamsIndex';
import CreateTeam from '../components/teams/createTeam';
import TeamDetail from '../components/teams/teamDetail';
import EditTeam from '../components/teams/editTeam';

// Branch Management Pages
import BranchesIndex from '../components/branches/branchesIndex';
import CreateBranch from '../components/branches/createBranch';
import BranchDetail from '../components/branches/branchDetail';
import EditBranch from '../components/branches/editBranch';

// Department Management Pages
import DepartmentsIndex from '../components/departments/departmentsIndex';
import CreateDepartment from '../components/departments/createDepartment';
import DepartmentDetail from '../components/departments/departmentDetail';
import EditDepartment from '../components/departments/editDepartment';

// Chat Components
import Chat from '../components/chats/Chat';

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
          
          {/* Chat Routes */}
          <Route path="chats" element={<Chat />} />
          
          {/* Analytics Routes */}
          <Route path="analytics">
            <Route index element={<Navigate to="analytical-report" replace />} />
            <Route path="analytical-report" element={<AnalyticalReport />} />
            <Route path="performance-report" element={<PerformanceReport />} />
          </Route>
          
          {/* Hajj & Umrah Routes */}
          <Route path="hajj-umrah">
            <Route path="hajj-packages" element={<HajjPackagesIndex />} />
            <Route path="hajj-packages/create" element={<HajjPackageCreate />} />
            <Route path="hajj-packages/:id/edit" element={<HajjPackageEdit />} />
            {/* Add other hajj-umrah routes here */}
          </Route>
          
          {/* Branch Management Routes */}
          <Route path="branches" element={<BranchesIndex />} />
          <Route path="branches/create" element={<CreateBranch />} />
          <Route path="branches/:id" element={<BranchDetail />} />
          <Route path="branches/:id/edit" element={<EditBranch />} />
          
          {/* User Management Routes */}
          <Route path="users" element={<UserIndex />} />
          <Route path="users/create" element={<UserCreate />} />
          <Route path="users/:id/edit" element={<UserEdit />} />
          
          {/* Leads Routes */}
          <Route path="leads" element={<LeadsIndex />} />
          <Route path="leads/create" element={<LeadCreate />} />
          <Route path="leads/:id" element={<LeadView />} />
          <Route path="leads/:id/edit" element={<LeadEdit />} />
          
          {/* Teams Routes */}
          <Route path="teams" element={<TeamsIndex />} />
          <Route path="teams/create" element={<CreateTeam />} />
          <Route path="teams/:id" element={<TeamDetail />} />
          <Route path="teams/:id/edit" element={<EditTeam />} />
          
          {/* Department Management Routes */}
          <Route path="departments" element={<DepartmentsIndex />} />
          <Route path="departments/create" element={<CreateDepartment />} />
          <Route path="departments/:id" element={<DepartmentDetail />} />
          <Route path="departments/:id/edit" element={<EditDepartment />} />
          
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