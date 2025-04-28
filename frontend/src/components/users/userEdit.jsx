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
  
  // Fetch user data and departments
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${api.defaults.baseURL}/users/${id}/`);
        setInitialData(response.data);
        form.setFieldsValue(response.data);
        setLoading(false);
      } catch (error) {
        message.error('Failed to fetch user data');
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, form]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${api.defaults.baseURL}/departments/`);
        setDepartments(response.data);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setError('Failed to load departments. Please try again.');
      }
    };
    fetchDepartments();
  }, []);
  
  const onFinish = async (values) => {
    try {
      await axios.put(`${api.defaults.baseURL}/users/${id}/`, values);
      message.success('User updated successfully');
      navigate('/users');
    } catch (error) {
      message.error('Failed to update user');
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
          onFinish={onFinish}
          form={form}
        />
      )}
    </div>
  );
};

export default UserEdit;
