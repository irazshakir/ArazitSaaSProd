import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Spin, Alert, Space, Breadcrumb, message } from 'antd';
import { HomeOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../services/api';
import UserForm from './userForm';

/**
 * Container component for editing existing users
 */
const UserEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch user data and departments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Variables to store responses
        let userResponse = null;
        let departmentsResponse = null;
        let userErrorMessages = [];
        let departmentsErrorMessages = [];
        
        // Fetch user data with fallback endpoints
        try {
          // Try main users endpoint first
          userResponse = await api.get(`users/${id}/`);
          console.log('Main users API success:', userResponse);
        } catch (error) {
          userErrorMessages.push(`Main endpoint error: ${error.message}`);
          console.log('Main users API failed, trying fallback');
          
          // Try auth endpoint
          try {
            userResponse = await api.get(`auth/users/${id}/`);
            console.log('Auth users API success:', userResponse);
          } catch (error2) {
            userErrorMessages.push(`Auth endpoint error: ${error2.message}`);
            console.log('Auth users API failed, trying admin endpoint');
            
            // Try admin endpoint as last resort
            try {
              userResponse = await api.get(`admin/users/${id}/`);
              console.log('Admin users API success:', userResponse);
            } catch (error3) {
              userErrorMessages.push(`Admin endpoint error: ${error3.message}`);
              console.error('All user API attempts failed');
              throw new Error(`Failed to fetch user data: ${userErrorMessages.join(', ')}`);
            }
          }
        }
        
        // Fetch departments with fallback endpoints
        try {
          // Try main departments endpoint first
          departmentsResponse = await api.get('departments/');
          console.log('Main departments API success:', departmentsResponse);
        } catch (error) {
          departmentsErrorMessages.push(`Main endpoint error: ${error.message}`);
          console.log('Main departments API failed, trying fallback');
          
          // Try auth endpoint
          try {
            departmentsResponse = await api.get('auth/departments/');
            console.log('Auth departments API success:', departmentsResponse);
          } catch (error2) {
            departmentsErrorMessages.push(`Auth endpoint error: ${error2.message}`);
            console.log('Auth departments API failed, trying users endpoint');
            
            // Try users endpoint as last resort
            try {
              departmentsResponse = await api.get('users/departments/');
              console.log('Users departments API success:', departmentsResponse);
            } catch (error3) {
              departmentsErrorMessages.push(`Users endpoint error: ${error3.message}`);
              console.log('All departments API attempts failed. Continuing with empty departments list.');
              // Don't throw error for departments, just use empty array
              departmentsResponse = { data: [] };
            }
          }
        }
        
        if (!userResponse) {
          throw new Error('No valid response for user data');
        }
        
        setUserData(userResponse.data);
        setDepartments(departmentsResponse?.data || []);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load user details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id]);
  
  // Handle successful form submission
  const handleSuccess = () => {
    message.success('User updated successfully!');
    navigate('/dashboard/users');
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
            title: `Edit: ${userData?.email || 'User'}`,
          },
        ]}
      />
      
      <Typography.Title level={3} style={{ marginBottom: '24px' }}>
        Edit User: {userData?.first_name} {userData?.last_name}
      </Typography.Title>
      
      {userData && (
        <UserForm 
          initialData={userData}
          departments={departments}
          isEditMode={true}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default UserEdit;
