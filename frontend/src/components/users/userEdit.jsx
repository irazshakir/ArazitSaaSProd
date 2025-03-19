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
        
        // Fetch user and departments in parallel
        const [userResponse, departmentsResponse] = await Promise.all([
          api.get(`users/${id}/`),
          api.get('departments/')
        ]);
        
        setUserData(userResponse.data);
        setDepartments(departmentsResponse.data);
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
