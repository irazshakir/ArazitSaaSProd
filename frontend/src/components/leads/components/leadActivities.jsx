import React, { useState, useEffect } from 'react';
import { 
  List, 
  Avatar, 
  Button, 
  Input, 
  Form, 
  Card, 
  Typography, 
  Divider, 
  Space, 
  Empty, 
  message,
  Select,
  DatePicker,
  Checkbox,
  Tabs
} from 'antd';
import { 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { Box } from '@mui/material';
import api from '../../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { TabPane } = Tabs;

/**
 * Component for displaying and managing lead activities
 * @param {string} leadId - The ID of the lead
 * @param {array} activities - Initial activities data
 */
const LeadActivities = ({ leadId, activities = [] }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leadActivities, setLeadActivities] = useState(activities);
  
  // Updated user info retrieval
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      console.log('Raw user data from localStorage:', userStr);
      
      if (!userStr) {
        console.error('No user data found in localStorage');
        return { user: null, userId: null, tenantId: null };
      }

      const user = JSON.parse(userStr);
      console.log('Parsed user data:', user);

      // Check if we have the ID directly or in a nested structure
      const userId = user.id || user.user_id;
      const tenantId = user.tenant_id || (user.tenant_details && user.tenant_details.id);

      console.log('Extracted IDs:', { userId, tenantId });

      return { user, userId, tenantId };
    } catch (error) {
      console.error('Error parsing user data:', error);
      return { user: null, userId: null, tenantId: null };
    }
  };

  const { user, userId, tenantId } = getUserInfo();

  // Add debug logging for initial values
  useEffect(() => {
    console.log('Initial Values:', {
      leadId,
      tenantId,
      userId,
      user,
      activities
    });
  }, [leadId, tenantId, userId, activities]);

  // Fetch activities if not provided
  useEffect(() => {
    if (!activities || activities.length === 0) {
      fetchActivities();
    } else {
      setLeadActivities(activities);
    }
  }, [activities, leadId]);
  
  // Fetch activities from API
  const fetchActivities = async () => {
    if (!leadId) {
      return;
    }

    try {
      setLoading(true);
      let activitiesArray = [];
      
      try {
        // Try the new endpoint first
        const response = await api.get(`/leads/${leadId}/activities/`);
        activitiesArray = response.data;
      } catch (error) {
        if (error.response?.status === 404) {
          // Fallback to the filtered endpoint
          const fallbackResponse = await api.get(`/lead-activities/?lead=${leadId}`);
          activitiesArray = Array.isArray(fallbackResponse.data) 
            ? fallbackResponse.data
            : (fallbackResponse.data?.results && Array.isArray(fallbackResponse.data.results))
              ? fallbackResponse.data.results
              : [];
        } else {
          throw error;
        }
      }
      
      setLeadActivities(activitiesArray);
    } catch (error) {
      // Only show error message if we're not using initial activities
      if (!activities || activities.length === 0) {
        message.error('Failed to load activities');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Updated handleAddActivity function with debugging
  const handleAddActivity = async (values) => {
    try {
      setSubmitting(true);
      
      // Debug logging for form values and session info
      console.log('Form Values:', values);
      console.log('Session Info:', {
        leadId,
        tenantId,
        userId,
        user: JSON.stringify(user)
      });

      // Validate required IDs with detailed logging
      if (!leadId) {
        console.error('Missing leadId:', leadId);
        message.error('Lead ID is required');
        return false;
      }

      if (!tenantId) {
        console.error('Missing tenantId:', tenantId);
        message.error('Tenant ID is missing');
        return false;
      }

      if (!userId) {
        console.error('Missing userId:', userId);
        message.error('User ID is missing');
        return false;
      }
      
      // Format dates
      const now = new Date().toISOString();
      
      // Prepare data for submission with debugging
      const activityData = {
        ...values,
        lead: leadId,
        tenant: tenantId,
        user: userId,
        created_at: now,
        updated_at: now,
        due_date: values.due_date ? values.due_date.toISOString() : null,
      };

      // Debug logging for final request data
      console.log('Activity Data being sent:', activityData);

      // Make API call
      const response = await api.post(`/leads/${leadId}/add-activity/`, activityData);
      
      // Debug logging for response
      console.log('API Response:', response.data);

      if (!response.data) {
        console.error('No data received from server');
        throw new Error('No data received from server');
      }

      // Update activities list
      setLeadActivities(prevActivities => [response.data, ...prevActivities]);
      
      // Reset form
      form.resetFields();
      
      message.success('Activity added successfully');
      return false;
    } catch (error) {
      // Enhanced error logging
      console.error('Error adding activity:', {
        error,
        errorMessage: error.message,
        errorResponse: error.response?.data,
        status: error.response?.status
      });
      
      // More specific error message based on the error
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to add activity. Please check console for details.');
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  };
  
  // Updated form submission wrapper with debugging
  const onFormSubmit = async (values, event) => {
    // Prevent default form submission behavior
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    
    // Debug logging for form submission
    console.log('Form Submission:', {
      values,
      formData: form.getFieldsValue()
    });
    
    await handleAddActivity(values);
  };

  // Delete an activity
  const handleDeleteActivity = async (activityId) => {
    try {
      await api.delete(`/lead-activities/${activityId}/`);
      
      // Remove activity from the list
      setLeadActivities(leadActivities.filter(activity => activity.id !== activityId));
      
      message.success('Activity deleted successfully');
    } catch (error) {
      message.error('Failed to delete activity');
    }
  };
  
  // Activity icon logic
  const getActivityIcon = (type) => {
    // Simple icon mapping based on common activity types
    switch(type.toLowerCase()) {
      case 'call':
        return <PhoneOutlined />;
      case 'email':
        return <MailOutlined />;
      case 'meeting':
        return <CalendarOutlined />;
      case 'task':
        return <ClockCircleOutlined />;
      default:
        return <UserOutlined />;
    }
  };
  
  // Add this useEffect for cleanup
  useEffect(() => {
    return () => {
      // Cleanup function
      setLeadActivities([]);
      setLoading(false);
      setSubmitting(false);
    };
  }, []);

  // Update the useEffect to depend on leadId
  useEffect(() => {
    if (leadId) {
      fetchActivities();
    } else {
      setLeadActivities([]); // Clear activities if no leadId
    }
  }, [leadId]);

  return (
    <Box sx={{ py: 2 }}>
      {/* Add Activity Form */}
      <Card title="Add Activity" style={{ marginBottom: 16 }}>
        <Form 
          form={form} 
          onFinish={onFormSubmit} 
          layout="vertical"
          noValidate
          preventDefault
          style={{ width: '100%' }}
          onValuesChange={(changedValues, allValues) => {
            // Debug logging for form value changes
            console.log('Form Values Changed:', {
              changedValues,
              allValues
            });
          }}
        >
          <Form.Item
            name="activity_type"
            label="Activity Type"
            rules={[
              { required: true, message: 'Please enter activity type' },
              { min: 2, message: 'Activity type must be at least 2 characters' }
            ]}
          >
            <Input 
              placeholder="Enter activity type (e.g., Call, Email, Meeting, Task)" 
            />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Please enter a description' },
              { min: 10, message: 'Description must be at least 10 characters' }
            ]}
          >
            <TextArea 
              rows={3} 
              placeholder="Enter activity description..." 
              maxLength={500} 
              showCount 
            />
          </Form.Item>
          
          <Form.Item
            name="due_date"
            label="Due Date"
          >
            <DatePicker 
              showTime 
              format="YYYY-MM-DD HH:mm"
              placeholder="Select due date and time (optional)"
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ backgroundColor: '#9d277c', borderColor: '#9d277c' }} 
              icon={<PlusOutlined />} 
              loading={submitting}
              onClick={(e) => {
                e.preventDefault();
                form.submit(); // Use form.submit() instead of direct submission
              }}
            >
              Add Activity
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      {/* Activities List */}
      <Card title="Activities History" loading={loading}>
        <List
          dataSource={leadActivities}
          renderItem={activity => (
            <List.Item
              key={activity.id}
              actions={[
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={() => handleDeleteActivity(activity.id)}
                >
                  Delete
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar icon={getActivityIcon(activity.activity_type)} />
                }
                title={
                  <Space>
                    <Typography.Text strong>
                      {activity.activity_type}
                      {activity.due_date && (
                        <>
                          <Typography.Text type="secondary"> | </Typography.Text>
                          <Typography.Text>
                            Due Date: {dayjs(activity.due_date).format('DD/MMM/YYYY')}
                          </Typography.Text>
                        </>
                      )}
                    </Typography.Text>
                  </Space>
                }
                description={
                  <div>
                    <Typography.Text>{activity.description}</Typography.Text>
                    <div>
                      <Typography.Text type="secondary">
                        {dayjs(activity.created_at).format('DD/MMM/YYYY')}
                      </Typography.Text>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{
            emptyText: <Empty description="No activities found" />
          }}
        />
      </Card>
    </Box>
  );
};

export default LeadActivities;
