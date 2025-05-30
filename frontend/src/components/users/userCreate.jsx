import React, { useState, useEffect, useCallback } from 'react';
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
  const [error, setError] = useState(null);
  
  // Check for tenant_id on component mount
  useEffect(() => {
    const storedTenantId = localStorage.getItem('tenant_id');
    
    if (!storedTenantId) {
      message.error('Tenant information is missing. Please log in again.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    setTenantId(storedTenantId);
  }, [navigate]);
  
  // Memoize form submission handler
  const handleFormSubmit = useCallback(async (formData) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Add tenant_id to the form data if not present
      if (!formData.has('tenant_id')) {
        formData.append('tenant_id', tenantId);
      }
      
      // Make API call to create user
      const response = await api.post('/api/auth/users/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data) {
        message.success('User created successfully!');
        navigate('/dashboard/users');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      const errorMessage = err.response?.data?.error || 
                         err.response?.data?.detail ||
                         'Failed to create user. Please try again.';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loading, tenantId, navigate]);
  
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
      
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}
      
      <UserForm 
        isEditMode={false}
        loading={loading}
        onFinish={handleFormSubmit}
      />
    </div>
  );
};

export default UserCreate;
