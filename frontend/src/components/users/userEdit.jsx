import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Spin, Alert, Space, Breadcrumb, message, Form } from 'antd';
import { HomeOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../services/api';
import UserForm from './userForm';
import axios from 'axios';

/**
 * Container component for editing existing users
 */
const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Fetch user data and departments
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          message.error('Authentication token not found. Please login again.');
          navigate('/login');
          return;
        }

        // Direct API call to fetch user data
        console.log(`Fetching user data for ID: ${id}`);
        const response = await axios.get(`${api.defaults.baseURL}/auth/users/${id}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('User data:', response.data);
        setInitialData(response.data);
        form.setFieldsValue(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user:', error.response?.data || error.message);
        if (error.response && error.response.status === 401) {
          message.error('Session expired. Please login again.');
          navigate('/login');
        } else {
          message.error('Failed to fetch user data');
        }
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [id, form, navigate]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          message.error('Authentication token not found. Please login again.');
          navigate('/login');
          return;
        }

        console.log('Fetching departments');
        const response = await axios.get(`${api.defaults.baseURL}/auth/departments/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Departments data:', response.data);
        setDepartments(response.data);
      } catch (error) {
        console.error('Error fetching departments:', error.response?.data || error.message);
        if (error.response && error.response.status === 401) {
          message.error('Session expired. Please login again.');
          navigate('/login');
        } else {
          setError('Failed to load departments. Please try again.');
        }
      }
    };
    
    fetchDepartments();
  }, [navigate]);
  
  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      
      // Capture form values directly from form instance to ensure latest values
      const latestValues = form.getFieldsValue(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication token not found. Please login again.');
        navigate('/login');
        return;
      }
      
      // Get tenant_id from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      if (!tenantId) {
        message.error('Tenant information is missing. Please log in again.');
        navigate('/login');
        return;
      }

      // Create a data object with all fields from the latest values
      const updatedFields = {
        email: latestValues.email,
        first_name: latestValues.first_name || '',
        last_name: latestValues.last_name || '',
        phone_number: latestValues.phone_number || '',
        role: latestValues.role,
        is_active: !!latestValues.is_active,
        tenant_id: tenantId
      };

      // Only include department/branch if they've been selected
      if (latestValues.department) {
        updatedFields.department = latestValues.department;
      }
      
      if (latestValues.branch) {
        updatedFields.branch = latestValues.branch;
      }
      
      // Show what's being sent for debugging
      console.log('Submitting user update with data:', updatedFields);
      
      try {
        // First try PATCH method
        const response = await axios.patch(
          `${api.defaults.baseURL}/auth/users/${id}/`, 
          updatedFields, 
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('PATCH response:', response.data);
        message.success('User updated successfully');
        
        // Navigate back
        setTimeout(() => {
          navigate('/dashboard/users');
        }, 1000);
      } catch (error) {
        console.error('PATCH failed:', error.response?.data || error.message);
        
        // If PATCH fails, try direct update
        try {
          const directResponse = await axios.post(
            `${api.defaults.baseURL}/api/auth/users/${id}/direct_update/`,
            updatedFields,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log('Direct update response:', directResponse.data);
          message.success('User updated successfully');
          
          // Navigate back
          setTimeout(() => {
            navigate('/dashboard/users');
          }, 1000);
        } catch (directError) {
          console.error('Direct update failed:', directError.response?.data || directError.message);
          const errorMsg = directError.response?.data?.error || directError.message;
          message.error(`Failed to update user: ${errorMsg}`);
        }
      }
    } catch (error) {
      message.error(`An error occurred: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Space>
              <button type="button" onClick={() => navigate('/dashboard/users')}>
                Back to Users
              </button>
            </Space>
          }
        />
      </div>
    );
  }
  
  // Show form with loaded data
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
            title: `Edit: ${initialData?.email || 'User'}`,
          },
        ]}
      />
      
      <Typography.Title level={3} style={{ marginBottom: '24px' }}>
        Edit User: {initialData?.first_name} {initialData?.last_name}
      </Typography.Title>
      
      {initialData && (
        <UserForm 
          initialData={initialData}
          departments={departments}
          isEditMode={true}
          onFinish={handleSubmit}
          form={form}
          loading={submitting}
        />
      )}
    </div>
  );
};

export default UserEdit;
