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
  
  // Get user and tenant info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tenantId = user.tenant_id;
  const userId = user.id;

  // Add debug logging for initial props and state
  useEffect(() => {
    // useEffect initialization
  }, []);

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
  
  // Updated handleAddActivity function with detailed debugging
  const handleAddActivity = async (values) => {
    try {
      setSubmitting(true);
      
      // Validate required IDs
      if (!leadId) {
        message.error('Lead ID is required');
        return false;
      }

      // Validate tenant and user info
      if (!tenantId || !userId) {
        message.error('Session information not available. Please log in again.');
        return false;
      }
      
      // Format dates
      const now = new Date().toISOString();
      
      // Prepare data for submission with correct field names
      const activityData = {
        ...values,
        lead: leadId,
        tenant: tenantId,        // Changed from tenant_id to tenant
        user: userId,            // Changed from user_id to user
        created_at: now,
        updated_at: now,
        due_date: values.due_date ? values.due_date.toISOString() : null,
      };

      // Make API call with explicit content type and prevent default
      const response = await api.post(`/leads/${leadId}/add-activity/`, activityData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Verify response data
      if (!response.data) {
        throw new Error('No data received from server');
      }

      // Update activities list
      setLeadActivities(prevActivities => {
        const newActivities = [response.data, ...prevActivities];
        return newActivities;
      });
      
      // Reset form
      form.resetFields();
      
      message.success('Activity added successfully');
      return false; // Explicitly return false to prevent form submission
    } catch (error) {
      // More specific error messages
      if (error.response?.status === 401) {
        message.error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 400) {
        message.error(`Validation error: ${JSON.stringify(error.response.data)}`);
      } else {
        message.error(`Failed to add activity: ${error.message || 'Unknown error'}`);
      }
      return false; // Explicitly return false even in case of error
    } finally {
      setSubmitting(false);
    }
  };
  
  // Updated form submission wrapper with event prevention
  const onFormSubmit = async (values, event) => {
    // Prevent default form submission behavior
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    
    // Prevent form submission if we don't have required IDs
    if (!leadId || !tenantId || !userId) {
      message.error('Missing required information. Please try again.');
      return;
    }
    
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
  
  // Updated activity icon logic
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
        >
          <Form.Item
            name="activity_type"
            label="Activity Type"
            rules={[{ required: true, message: 'Please enter activity type' }]}
          >
            <Input 
              placeholder="Enter activity type (e.g., Call, Email, Meeting, Task)" 
            />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
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