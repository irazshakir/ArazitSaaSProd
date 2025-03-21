import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Breadcrumb, message, Alert } from 'antd';
import { HomeOutlined, UserOutlined } from '@ant-design/icons';
import UserForm from './userForm';
import api from '../../services/api';

/**
 * Container component for creating new users within a tenant
 */
const UserCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState(null);
  
  // Check for tenant_id on component mount
  useEffect(() => {
    // Verify tenant_id exists in localStorage
    const storedTenantId = localStorage.getItem('tenant_id');
    
    if (!storedTenantId) {
      message.error('Tenant information is missing. Please log in again.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    setTenantId(storedTenantId);
    console.log('Creating user for tenant:', storedTenantId);
  }, [navigate]);
  
  // Handle successful form submission
  const handleSuccess = () => {
    message.success('User created successfully!');
    navigate('/dashboard/users');
  };
  
  // If no tenant ID is found, show error message
  if (!tenantId) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Tenant Information Missing"
          description="Unable to create a user without tenant information. You will be redirected to login."
          type="error"
          showIcon
        />
      </div>
    );
  }
  
  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumb 
        style={{ marginBottom: '16px' }}
        items={[
          {
            title: <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}><HomeOutlined /> Dashboard</span>,
          },
          {
            title: <span onClick={() => navigate('/dashboard/users')} style={{ cursor: 'pointer' }}><UserOutlined /> Users</span>,
          },
          {
            title: 'Create User',
          },
        ]}
      />
      
      <Typography.Title level={3} style={{ marginBottom: '24px' }}>
        Create New User
      </Typography.Title>
      
      {/* Additional tenant context information */}
      <Alert
        message={`Creating user for tenant: ${tenantId}`}
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <UserForm 
        isEditMode={false}
        loading={loading}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default UserCreate;
