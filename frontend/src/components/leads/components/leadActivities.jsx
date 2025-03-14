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
  const [activeTab, setActiveTab] = useState('all');
  
  // Activity type options
  const activityTypes = [
    { value: 'call', label: 'Call', icon: <PhoneOutlined /> },
    { value: 'email', label: 'Email', icon: <MailOutlined /> },
    { value: 'meeting', label: 'Meeting', icon: <CalendarOutlined /> },
    { value: 'task', label: 'Task', icon: <ClockCircleOutlined /> }
  ];
  
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
    try {
      setLoading(true);
      const response = await api.get(`/lead-activities/?lead=${leadId}`);
      
      // Process response data
      let activitiesArray = Array.isArray(response.data) 
        ? response.data
        : (response.data?.results && Array.isArray(response.data.results))
          ? response.data.results
          : [];
      
      setLeadActivities(activitiesArray);
    } catch (error) {
      console.error('Error fetching activities:', error);
      message.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };
  
  // Add a new activity
  const handleAddActivity = async (values) => {
    try {
      setSubmitting(true);
      
      // Format due date if present
      if (values.due_date) {
        values.due_date = values.due_date.toISOString();
      }
      
      const response = await api.post('/leads/' + leadId + '/add-activity/', {
        ...values,
        lead: leadId
      });
      
      // Add new activity to the list
      setLeadActivities([response.data, ...leadActivities]);
      
      // Reset form
      form.resetFields();
      
      message.success('Activity added successfully');
    } catch (error) {
      console.error('Error adding activity:', error);
      message.error('Failed to add activity');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Delete an activity
  const handleDeleteActivity = async (activityId) => {
    try {
      await api.delete(`/lead-activities/${activityId}/`);
      
      // Remove activity from the list
      setLeadActivities(leadActivities.filter(activity => activity.id !== activityId));
      
      message.success('Activity deleted successfully');
    } catch (error) {
      console.error('Error deleting activity:', error);
      message.error('Failed to delete activity');
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };
  
  // Get filtered activities based on active tab
  const getFilteredActivities = () => {
    if (activeTab === 'all') {
      return leadActivities;
    }
    return leadActivities.filter(activity => activity.activity_type === activeTab);
  };
  
  // Get icon for activity type
  const getActivityIcon = (type) => {
    const activity = activityTypes.find(a => a.value === type);
    return activity ? activity.icon : <UserOutlined />;
  };
  
  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };
  
  // Get activity type label
  const getActivityTypeLabel = (type) => {
    const activity = activityTypes.find(a => a.value === type);
    return activity ? activity.label : type;
  };
  
  return (
    <Box sx={{ py: 2 }}>
      {/* Add Activity Form */}
      <Card title="Add Activity" style={{ marginBottom: 16 }}>
        <Form form={form} onFinish={handleAddActivity} layout="vertical" initialValues={{ activity_type: 'call' }}>
          <Form.Item
            name="activity_type"
            label="Activity Type"
            rules={[{ required: true, message: 'Please select activity type' }]}
          >
            <Select>
              {activityTypes.map(type => (
                <Select.Option key={type.value} value={type.value}>
                  <Space>
                    {type.icon}
                    {type.label}
                  </Space>
                </Select.Option>
              ))}
            </Select>
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
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.activity_type !== currentValues.activity_type
            }
          >
            {({ getFieldValue }) => {
              const activityType = getFieldValue('activity_type');
              
              return (
                <>
                  {/* Duration field for calls, emails, meetings */}
                  {(activityType === 'call' || activityType === 'meeting') && (
                    <Form.Item
                      name="duration"
                      label="Duration (minutes)"
                    >
                      <Input type="number" min={1} placeholder="Enter duration in minutes" />
                    </Form.Item>
                  )}
                  
                  {/* Due date field for tasks */}
                  {activityType === 'task' && (
                    <>
                      <Form.Item
                        name="due_date"
                        label="Due Date"
                        rules={[{ required: true, message: 'Please select a due date' }]}
                      >
                        <DatePicker showTime format="YYYY-MM-DD HH:mm" />
                      </Form.Item>
                    </>
                  )}
                </>
              );
            }}
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<PlusOutlined />} 
              loading={submitting}
            >
              Add Activity
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      {/* Activities List */}
      <Card title="Activities History" loading={loading}>
        {getFilteredActivities().map(activity => (
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
                    {getActivityTypeLabel(activity.activity_type)}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: '0.8rem' }}>
                    {formatDate(activity.due_date)}
                  </Typography.Text>
                </Space>
              }
              description={activity.description}
            />
          </List.Item>
        ))}
      </Card>
    </Box>
  );
};

export default LeadActivities;
