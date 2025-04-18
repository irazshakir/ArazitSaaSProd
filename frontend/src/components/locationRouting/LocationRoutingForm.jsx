import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Grid, Typography, Paper, Box } from '@mui/material';
import { Form, Input, Select, Row, Col, Divider, Switch, message, Button, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Option } = Select;

const LocationRoutingForm = forwardRef(function LocationRoutingForm({ form, initialData, onSave }, ref) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    locations: [],
    assigned_users: {},
    is_active: true
  });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [cityInput, setCityInput] = useState('');
  const [cityInputVisible, setCityInputVisible] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Fetch available users (sales agents) when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenant_id');

        const response = await api.get('/auth/users/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          params: {
            role: 'sales_agent',
            is_active: true,
            tenant: tenantId
          }
        });
        setAvailableUsers(response.data.results || response.data);
      } catch (error) {
        if (error.response?.status === 403) {
          message.error('You do not have permission to view users');
        } else {
          message.error('Failed to load available users');
        }
      }
    };
    fetchUsers();
  }, []);

  // Load initial data if editing existing routing
  useEffect(() => {
    if (initialData) {
      setFormData({
        locations: initialData.locations || [],
        assigned_users: initialData.assigned_users || {},
        is_active: initialData.is_active ?? true
      });
      form.setFieldsValue(initialData);
    }
  }, [initialData, form]);

  // Debug log for form values
  useEffect(() => {
    console.log('Form values changed:', form.getFieldsValue());
  }, [form]);

  // Debug log for selected users state
  useEffect(() => {
    console.log('Selected users state:', selectedUsers);
  }, [selectedUsers]);

  const handleCityInputConfirm = () => {
    if (!cityInput) return;

    const normalizedCity = cityInput.trim();
    if (normalizedCity && !formData.locations.includes(normalizedCity)) {
      setFormData(prev => ({
        ...prev,
        locations: [...prev.locations, normalizedCity]
      }));
      message.success(`Added city: ${normalizedCity}`);
    }
    setCityInput('');
    setCityInputVisible(false);
  };

  const handleRemoveCity = (removedCity) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter(city => city !== removedCity)
    }));
    message.success('City removed');
  };

  const handleAssignUsers = async () => {
    console.log('Assign Users clicked');
    const formValues = form.getFieldsValue();
    console.log('Current form values:', formValues);

    try {
      const selectedUserIds = formValues.selectedUsers;
      console.log('Selected users:', selectedUserIds);
      
      if (!selectedUserIds || selectedUserIds.length === 0) {
        message.error('Please select users to assign');
        return;
      }

      // Create new assigned users object with required structure
      const newAssignedUsers = { ...formData.assigned_users };
      let usersAdded = false;

      selectedUserIds.forEach(userId => {
        const user = availableUsers.find(u => u.id === userId);
        if (user && !formData.assigned_users[userId]) {
          newAssignedUsers[userId] = {
            name: `${user.first_name} ${user.last_name}`.trim() || user.email,
            count: 0,
            active: true,
            added_at: new Date().toISOString()
          };
          usersAdded = true;
        }
      });

      if (!usersAdded) {
        message.warning('No new users to assign');
        return;
      }

      // Create locations object with required structure
      const locationsObject = formData.locations.reduce((acc, cityName) => {
        acc[cityName.toLowerCase()] = {
          name: cityName,
          active: true
        };
        return acc;
      }, {});

      // Update form data with properly structured data
      const updatedFormData = {
        ...formData,
        locations: locationsObject,
        assigned_users: newAssignedUsers
      };

      setFormData(updatedFormData);

      // Save to backend if this is a new configuration
      if (!initialData?.id) {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenant_id');
        
        const payload = {
          tenant: tenantId,
          locations: locationsObject,
          assigned_users: newAssignedUsers,
          is_active: updatedFormData.is_active
        };

        try {
          const response = await api.post('/location-routing/', payload, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });
          console.log('Location routing saved:', response.data);
          if (onSave) {
            onSave(response.data);
          }
        } catch (error) {
          console.error('Error saving location routing:', error.response?.data || error);
          if (error.response?.status === 403) {
            message.error('You do not have admin permissions to perform this action');
          } else {
            message.error('Failed to save location routing configuration');
          }
          return;
        }
      }

      // Only clear selection after successful update
      form.setFieldsValue({ selectedUsers: [] });
      setSelectedUsers([]);
      message.success('Users assigned successfully');
    } catch (error) {
      console.error('Error in handleAssignUsers:', error);
      message.error('Failed to assign users');
    }
  };

  const handleRemoveUser = (userId) => {
    const newAssignedUsers = { ...formData.assigned_users };
    delete newAssignedUsers[userId];
    setFormData(prev => ({
      ...prev,
      assigned_users: newAssignedUsers
    }));
    // Update selected users state
    setSelectedUsers(prev => prev.filter(id => id !== userId));
    message.success('User removed from routing');
  };

  // Save location routing data
  const saveLocationRouting = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      console.log('Form values to save:', values);
      
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenant_id');

      // Create locations object with required structure
      const locationsObject = formData.locations.reduce((acc, cityName) => {
        acc[cityName.toLowerCase()] = {
          name: cityName,
          active: true
        };
        return acc;
      }, {});
      
      const payload = {
        tenant: tenantId,
        locations: locationsObject,
        assigned_users: formData.assigned_users,
        is_active: values.is_active
      };

      console.log('Payload to save:', payload);

      let response;
      if (initialData?.id) {
        response = await api.put(`/location-routing/${initialData.id}/`, payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
      } else {
        response = await api.post('/location-routing/', payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
      }

      console.log('Save response:', response.data);
      message.success('Location routing saved successfully');
      if (onSave) {
        onSave(response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Error saving location routing:', error.response?.data || error);
      if (error.response?.status === 403) {
        message.error('You do not have admin permissions to perform this action');
      } else if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error('Failed to save location routing');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Expose save function to parent
  useImperativeHandle(ref, () => ({
    saveLocationRouting
  }));

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#9d277c', fontWeight: 'bold' }}>
            Location Routing Configuration {loading && '(Loading...)'}
          </Typography>

          {/* Cities Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>Cities</Typography>
            <Box sx={{ mb: 2 }}>
              {formData.locations.map((city, index) => (
                <Tag
                  key={index}
                  closable
                  onClose={() => handleRemoveCity(city)}
                  style={{ marginBottom: 8 }}
                >
                  {city}
                </Tag>
              ))}
              {cityInputVisible ? (
                <Input
                  type="text"
                  size="small"
                  style={{ width: 100, marginRight: 8, verticalAlign: 'top' }}
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  onBlur={handleCityInputConfirm}
                  onPressEnter={handleCityInputConfirm}
                  placeholder="Add city"
                />
              ) : (
                <Tag 
                  onClick={() => setCityInputVisible(true)}
                  style={{ background: '#fff', borderStyle: 'dashed', cursor: 'pointer' }}
                >
                  <PlusOutlined /> Add City
                </Tag>
              )}
            </Box>
          </Box>

          <Divider />

          {/* User Assignment Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>Assign Users</Typography>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="selectedUsers"
                  rules={[
                    {
                      required: true,
                      message: 'Please select users to assign',
                    }
                  ]}
                  initialValue={[]}
                >
                  <Select
                    mode="multiple"
                    placeholder="Select users to assign"
                    style={{ width: '100%' }}
                    disabled={loading || formData.locations.length === 0}
                    allowClear
                    onChange={(value) => {
                      console.log('Select onChange value:', value);
                      setSelectedUsers(value || []);
                      form.setFieldsValue({ selectedUsers: value || [] });
                    }}
                    value={selectedUsers || []}
                    optionFilterProp="children"
                  >
                    {availableUsers
                      .filter(user => !formData.assigned_users[user.id])
                      .map(user => (
                        <Option key={user.id} value={user.id}>
                          {`${user.first_name} ${user.last_name}`.trim() || user.email}
                        </Option>
                      ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item>
                  <Button 
                    type="primary"
                    onClick={handleAssignUsers}
                    disabled={loading || formData.locations.length === 0}
                  >
                    Assign Users
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Box>

          {/* Display Assigned Users */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>Assigned Users:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(formData.assigned_users).map(([userId, user]) => (
                <Tag
                  key={userId}
                  closable
                  onClose={() => handleRemoveUser(userId)}
                  color="green"
                >
                  {user.name}
                </Tag>
              ))}
            </Box>
          </Box>

          <Divider />

          {/* Active Status */}
          <Form.Item
            label="Active"
            name="is_active"
            valuePropName="checked"
            style={{ marginBottom: 0, width: '120px' }}
          >
            <Switch
              checked={formData.is_active}
              onChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              disabled={loading}
            />
          </Form.Item>
        </Paper>
      </Grid>
    </Grid>
  );
});

export default LocationRoutingForm; 