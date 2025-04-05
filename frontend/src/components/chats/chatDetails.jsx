import React, { useState, useEffect } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Form, Input, Select, DatePicker, Switch, Spin, message } from 'antd';
import api from '../../services/api';
import './chatDetails.css';
import dayjs from 'dayjs';

const ChatDetails = ({ activeChat, isOpen, onClose }) => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departmentUsers, setDepartmentUsers] = useState({});
  const [existingLead, setExistingLead] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);

  // Primary color of the app
  const primaryColor = '#9d277c'; // Your app's primary color

  // Helper function to safely convert to number
  const safeNumberConversion = (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
  };

  // Force update the assigned_to field
  const forceUpdateAssignedTo = (value) => {
    if (value === undefined || value === null) return;
    
    console.log(`Force updating assigned_to to ${value} (${typeof value})`);
    
    // Convert to string to ensure consistent type comparison
    const stringValue = String(value);
    
    // Log all available user IDs for comparison
    const allIds = users.map(u => String(u.id));
    console.log('Available user IDs (as strings):', allIds);
    
    // Check if the value exists in our user list
    const userExists = allIds.includes(stringValue);
    console.log(`User ID ${stringValue} exists in options: ${userExists}`);
    
    if (userExists) {
      // Direct DOM manipulation as a last resort
      setTimeout(() => {
        try {
          // First try the Ant Design way
          form.setFields([
            {
              name: 'assigned_to',
              value: value
            }
          ]);
          
          // Then try to directly set the value
          const assignedToField = document.querySelector('input[name="assigned_to"]');
          if (assignedToField) {
            assignedToField.value = value;
          }
          
          console.log('Forced assigned_to update complete');
        } catch (e) {
          console.error('Error forcing assigned_to update:', e);
        }
      }, 500);
    }
  };

  // Reset form when active chat changes
  useEffect(() => {
    if (activeChat?.id && activeChat.id !== activeChatId) {
      console.log('Active chat changed, resetting form and fetching new lead data');
      setActiveChatId(activeChat.id);
      setExistingLead(null);
      form.resetFields();
      
      // Set default values based on the new active chat
      form.setFieldsValue({
        name: activeChat.name || '',
        phone: activeChat.phone || '',
        email: activeChat.email || '',
        lead_type: 'new',
        status: 'new',
        source: 'whatsapp',
        lead_activity_status: true
      });
    }
  }, [activeChat?.id, form, activeChatId]);

  // Check for existing lead when chat is opened
  useEffect(() => {
    const checkExistingLead = async () => {
      if (!activeChat?.id || activeChat.id !== activeChatId) {
        console.log('No active chat available or chat ID mismatch');
        return;
      }

      try {
        setLoading(true);
        
        // Get tenant ID from localStorage
        const tenantId = localStorage.getItem('tenant_id');
        console.log('Using tenant ID for lead:', tenantId);
        
        if (!tenantId) {
          message.error('Tenant information is missing');
          setLoading(false);
          return;
        }
        
        // First explicitly create/update lead from this chat to ensure we have one
        try {
          console.log(`Creating/updating lead for contact ${activeChat.id} with tenant ${tenantId}`);
          
          const createLeadResponse = await api.post(`/api/waba/create-lead/${activeChat.id}/`, {
            tenant_id: tenantId
          }, {
            headers: {
              'X-Tenant-ID': tenantId
            }
          });
          
          if (createLeadResponse.status === 200) {
            console.log('Lead created/updated:', createLeadResponse.data);
            
            if (createLeadResponse.data.lead) {
              const leadData = createLeadResponse.data.lead;
              setExistingLead(leadData);
              
              // Debug assigned_to value
              console.log('DEBUG - Lead data from API:', leadData);
              
              // Extract assigned_to from various possible sources
              let assignedToId = null;
              if (leadData.assigned_to_details && leadData.assigned_to_details.id) {
                assignedToId = leadData.assigned_to_details.id;
                console.log('DEBUG - Using assigned_to_details.id:', assignedToId);
              } else if (leadData.assigned_to_id !== undefined) {
                assignedToId = leadData.assigned_to_id;
                console.log('DEBUG - Using assigned_to_id:', assignedToId);
              } else if (leadData.assigned_to !== undefined) {
                assignedToId = leadData.assigned_to;
                console.log('DEBUG - Using assigned_to:', assignedToId);
              }
              
              // Populate form with lead data
              const formData = {
                name: leadData.name,
                email: leadData.email,
                phone: leadData.phone,
                lead_type: leadData.lead_type,
                status: leadData.status,
                source: leadData.source || 'whatsapp',
                assigned_to: {
                  value: assignedToId,
                  label: leadData.assigned_to_details ? 
                    `${leadData.assigned_to_details.first_name} ${leadData.assigned_to_details.last_name || ''}`.trim() :
                    ''
                },
                lead_activity_status: leadData.lead_activity_status === 'active',
                next_follow_up: leadData.next_follow_up ? dayjs(leadData.next_follow_up) : null
              };
              
              console.log('Setting form data with assigned_to:', assignedToId);
              form.setFieldsValue(formData);
              
              setLoading(false);
              return;
            }
          }
        } catch (createLeadError) {
          console.error('Error creating/updating lead:', createLeadError);
        }
        
        // If the explicit creation failed, try to get existing lead
        try {
          const whatsAppLeadResponse = await api.get(`/api/waba/lead/${activeChat.id}/`, {
            params: { tenant_id: tenantId }
          });
          
          if (whatsAppLeadResponse.status === 200) {
            console.log('Found WhatsApp lead:', whatsAppLeadResponse.data);
            const leadData = whatsAppLeadResponse.data; // Define leadData for this scope
            setExistingLead(leadData);
            
            // Debug assigned_to value
            console.log('DEBUG - WhatsApp lead data:', leadData);
            
            // Extract assigned_to value from various possible sources
            let assignedTo = null;
            
            // Check for assigned_to_details (which contains the actual user object)
            if (leadData.assigned_to_details && leadData.assigned_to_details.id) {
              assignedTo = leadData.assigned_to_details.id;
              console.log('DEBUG - Using assigned_to_details.id:', assignedTo);
            } 
            // Fallback to direct properties
            else if (leadData.assigned_to_id !== undefined) {
              assignedTo = leadData.assigned_to_id;
              console.log('DEBUG - Using assigned_to_id:', assignedTo);
            } else if (leadData.assigned_to !== undefined) {
              assignedTo = leadData.assigned_to;
              console.log('DEBUG - Using assigned_to:', assignedTo);
            }

            // Populate form with existing lead data
            const formData = {
              name: leadData.name,
              email: leadData.email,
              phone: leadData.phone,
              lead_type: leadData.lead_type,
              status: leadData.status,
              source: leadData.source || 'whatsapp',
              assigned_to: {
                value: assignedTo,
                label: leadData.assigned_to_details ? 
                  `${leadData.assigned_to_details.first_name} ${leadData.assigned_to_details.last_name || ''}`.trim() :
                  ''
              },
              lead_activity_status: leadData.lead_activity_status === 'active',
              next_follow_up: leadData.next_follow_up ? dayjs(leadData.next_follow_up) : null
            };

            console.log('Setting form data with assigned_to:', assignedTo);
            form.setFieldsValue(formData);
            
            setLoading(false);
          }
        } catch (whatsAppError) {
          console.log('No WhatsApp lead found, falling back to phone search:', whatsAppError);
        }
        
        // Fall back to searching by phone number
        if (!activeChat?.phone) {
          console.log('No phone number available in active chat');
          setLoading(false);
          return;
        }

        console.log('Checking for lead with phone number:', activeChat.phone);

        // Use the same endpoint as leadsIndex
        const response = await api.get('/leads/', {
          params: {
            phone: activeChat.phone,
            tenant: tenantId
          }
        });

        console.log('Lead search response:', response.data);

        // Check if we found a lead with this phone number
        let lead = null;
        if (Array.isArray(response.data) && response.data.length > 0) {
          lead = response.data[0];
        } else if (response.data?.results && response.data.results.length > 0) {
          lead = response.data.results[0];
        }

        if (lead) {
          console.log('Found existing lead:', lead);
          setExistingLead(lead);

          // Debug assigned_to value
          console.log('DEBUG - Lead from phone search:', lead);
          
          // Extract assigned_to value from various possible sources
          let assignedTo = null;
          
          // Check for assigned_to_details (which contains the actual user object)
          if (lead.assigned_to_details && lead.assigned_to_details.id) {
            assignedTo = lead.assigned_to_details.id;
            console.log('DEBUG - Using assigned_to_details.id:', assignedTo);
          } 
          // Fallback to direct properties
          else if (lead.assigned_to_id !== undefined) {
            assignedTo = lead.assigned_to_id;
            console.log('DEBUG - Using assigned_to_id:', assignedTo);
          } else if (lead.assigned_to !== undefined) {
            assignedTo = lead.assigned_to;
            console.log('DEBUG - Using assigned_to:', assignedTo);
          }

          // Populate form with existing lead data
          const formData = {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            lead_type: lead.lead_type,
            status: lead.status,
            source: lead.source || 'whatsapp',
            assigned_to: {
              value: assignedTo,
              label: lead.assigned_to_details ? 
                `${lead.assigned_to_details.first_name} ${lead.assigned_to_details.last_name || ''}`.trim() :
                ''
            },
            lead_activity_status: lead.lead_activity_status === 'active',
            next_follow_up: lead.next_follow_up ? dayjs(lead.next_follow_up) : null
          };

          console.log('Setting form data with assigned_to:', assignedTo);
          form.setFieldsValue(formData);
          
          setLoading(false);
        } else {
          console.log('No existing lead found, will create new');
          // Reset form for new lead - do not set assigned_to to avoid NaN
          form.setFieldsValue({
            name: activeChat.name || '',
            phone: activeChat.phone || '',
            email: '',
            lead_type: 'new',
            status: 'new',
            source: 'whatsapp',
            lead_activity_status: true
            // Do not set assigned_to here
          });
        }
      } catch (error) {
        console.error('Error checking for existing lead:', error);
        message.error('Failed to check lead information');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && activeChat?.id && users.length > 0) {
      checkExistingLead();
    }
  }, [activeChat?.id, activeChat?.phone, isOpen, form, users, activeChatId]);

  // Add a new useEffect to handle existing lead changes
  useEffect(() => {
    if (existingLead && users.length > 0) {
      console.log('Existing lead changed, updating assigned_to');
      
      // Extract assigned_to from various possible sources
      let assignedToId = null;
      if (existingLead.assigned_to_details && existingLead.assigned_to_details.id) {
        assignedToId = existingLead.assigned_to_details.id;
        console.log('From effect - Using assigned_to_details.id:', assignedToId);
      } else if (existingLead.assigned_to_id !== undefined) {
        assignedToId = existingLead.assigned_to_id;
        console.log('From effect - Using assigned_to_id:', assignedToId);
      } else if (existingLead.assigned_to !== undefined) {
        assignedToId = existingLead.assigned_to;
        console.log('From effect - Using assigned_to:', assignedToId);
      }
      
      if (assignedToId) {
        console.log(`Found assigned_to value: ${assignedToId}`);
        // Try to set it multiple ways
        form.setFieldValue('assigned_to', assignedToId);
        
        // Also try using setFields for more control
        form.setFields([
          {
            name: 'assigned_to',
            value: assignedToId
          }
        ]);
      }
    }
  }, [existingLead, users.length, form]);

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const tenantId = localStorage.getItem('tenant_id');

      if (!tenantId) {
        console.warn('No tenant ID found in local storage');
        setLoading(false);
        return;
      }

      try {
        // Try to get users from both endpoints
        let userData = [];
        
        try {
          const response = await api.get('auth/users/', {
            params: {
              tenant: tenantId,
              is_active: true
            }
          });
          
          if (Array.isArray(response.data)) {
            userData = response.data;
          } else if (response.data?.results && Array.isArray(response.data.results)) {
            userData = response.data.results;
          }
        } catch (error) {
          console.log('Auth users endpoint failed, trying direct users endpoint');
          const response = await api.get('users/', {
            params: {
              tenant: tenantId,
              is_active: true
            }
          });
          
          if (Array.isArray(response.data)) {
            userData = response.data;
          } else if (response.data?.results && Array.isArray(response.data.results)) {
            userData = response.data.results;
          }
        }

        // Log the full user data to check its structure
        console.log('DEBUG - Full user data:', userData);
        
        // Organize users by department
        const usersByDepartment = userData.reduce((acc, user) => {
          const deptName = user.department_name || 'No Department';
          if (!acc[deptName]) {
            acc[deptName] = [];
          }
          acc[deptName].push(user);
          return acc;
        }, {});

        console.log('Users organized by department:', usersByDepartment);
        
        // Map IDs to help with debugging
        const userIds = userData.map(u => u.id);
        console.log('All available user IDs:', userIds);
        
        setDepartmentUsers(usersByDepartment);
        setUsers(userData);
        
        // After users are loaded, explicitly get and set the assigned_to value again
        const currentAssignedTo = form.getFieldValue('assigned_to');
        console.log('Current assigned_to after loading users:', currentAssignedTo);
        
        if (currentAssignedTo !== undefined && currentAssignedTo !== null) {
          // This uses a longer timeout to ensure users are fully rendered
          setTimeout(() => {
            console.log('Setting assigned_to explicitly after users loaded:', currentAssignedTo);
            form.setFieldValue('assigned_to', currentAssignedTo);
          }, 500);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load users:', error);
        message.error('Failed to load users');
        setLoading(false);
      }
    };

    fetchUsers();
  }, [form]);

  // Add this new effect to force data refresh when the drawer is opened
  useEffect(() => {
    if (isOpen && activeChat?.id) {
      console.log('ChatDetails: Drawer opened, forcing data refresh for chat ID:', activeChat.id);
      
      // Reset state and form
      setActiveChatId(null);
      setExistingLead(null);
      form.resetFields();
      
      // Set basic fields from active chat
      form.setFieldsValue({
        name: activeChat.name || '',
        phone: activeChat.phone || '',
        email: '',
        lead_type: 'new',
        status: 'new',
        source: 'whatsapp',
        lead_activity_status: true
      });
      
      // Set active chat ID with slight delay to trigger the fetch effect
      setTimeout(() => {
        setActiveChatId(activeChat.id);
      }, 50);
    }
  }, [isOpen, activeChat?.id, form]);

  // Lead type options based on your Lead model
  const leadTypeOptions = [
    { value: 'hajj_package', label: 'Hajj Package' },
    { value: 'custom_umrah', label: 'Custom Umrah' },
    { value: 'readymade_umrah', label: 'Readymade Umrah' },
    { value: 'flight', label: 'Flight' },
    { value: 'visa', label: 'Visa' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'ziyarat', label: 'Ziyarat' }
  ];

  // Lead status options based on your Lead model
  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'non_potential', label: 'Non-Potential' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' }
  ];

  // Lead source options based on your Lead model
  const sourceOptions = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'fb_form', label: 'FB Form' },
    { value: 'messenger', label: 'Messenger' },
    { value: 'insta_form', label: 'Insta Form' },
    { value: 'website_form', label: 'Website Form' },
    { value: 'website_chat', label: 'Website Chat' },
    { value: 'referral', label: 'Referral' },
    { value: 'walk_in', label: 'Walk In' }
  ];

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      const tenantId = localStorage.getItem('tenant_id');

      if (!tenantId) {
        message.error('Tenant information is missing');
        return;
      }

      // Prepare lead data
      const leadData = {
        tenant: tenantId,
        name: values.name,
        email: values.email,
        phone: values.phone,
        whatsapp: values.phone,
        lead_type: values.lead_type,
        status: values.status,
        source: values.source,
        assigned_to: values.assigned_to?.value || values.assigned_to,
        lead_activity_status: values.lead_activity_status ? 'active' : 'inactive',
        next_follow_up: values.next_follow_up?.format('YYYY-MM-DD'),
        chat_id: activeChat.id  // Ensure we link to this specific chat
      };

      let response;
      if (existingLead) {
        // Use the same endpoint as leadEdit
        try {
          response = await api.put(`/leads/${existingLead.id}/`, leadData);
          console.log('Lead updated:', response.data);
          message.success('Lead updated successfully');
        } catch (error) {
          console.error('Error updating lead:', error);
          throw new Error('Failed to update lead');
        }
      } else {
        // Use the same endpoint as leadCreate
        try {
          response = await api.post('/leads/', leadData);
          console.log('Lead created:', response.data);
          message.success('Lead created successfully');
        } catch (error) {
          console.error('Error creating lead:', error);
          throw new Error('Failed to create lead');
        }
      }

      // Close the drawer after successful submission
      onClose();

    } catch (error) {
      console.error('Error submitting lead:', error);
      message.error(error.message || 'Failed to process lead');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeChat) {
    return null;
  }

  return (
    <div className={`chat-details-drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-header">
        <h2>{existingLead ? 'Update Lead Details' : 'Create New Lead'}</h2>
        <button className="close-button" onClick={onClose}>
          <CloseOutlined />
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
          <p>Checking lead information...</p>
        </div>
      ) : (
        <div className="drawer-content">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              name: activeChat.name || '',
              phone: activeChat.phone || '',
              email: activeChat.email || '',
              lead_type: 'new',
              status: 'new',
              source: 'whatsapp',
              lead_activity_status: true
            }}
          >
            {/* Lead Information Section */}
            <div className="details-section">
              <h3>Lead Information</h3>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: 'Please enter name' }]}
              >
                <Input placeholder="Enter name" />
              </Form.Item>

              <Form.Item
                label="Phone"
                name="phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[{ type: 'email', message: 'Please enter valid email' }]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </div>

            {/* Lead Details Section */}
            <div className="details-section">
              <h3>Lead Details</h3>
              <Form.Item
                label="Lead Type"
                name="lead_type"
                rules={[{ required: true, message: 'Please select lead type' }]}
              >
                <Select options={leadTypeOptions} />
              </Form.Item>

              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select options={statusOptions} />
              </Form.Item>

              <Form.Item
                label="Lead Source"
                name="source"
                rules={[{ required: true, message: 'Please select source' }]}
              >
                <Select options={sourceOptions} />
              </Form.Item>
            </div>

            {/* Assignment Section - Updated */}
            <div className="details-section">
              <h3>Assignment</h3>
              <Form.Item
                label="Assigned To"
                name="assigned_to"
                rules={[{ required: true, message: 'Please select assignee' }]}
              >
                <Select
                  placeholder="Select user"
                  loading={loading}
                  showSearch
                  labelInValue
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label || '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={Object.entries(departmentUsers).flatMap(([department, deptUsers]) =>
                    deptUsers.map(user => ({
                      value: String(user.id),
                      label: `${user.first_name} ${user.last_name || ''}`.trim() || user.email,
                      group: department
                    }))
                  )}
                  optionGroupRender={(group) => <span>{group.label}</span>}
                />
              </Form.Item>

              <Form.Item
                label="Activity Status"
                name="lead_activity_status"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Active"
                  unCheckedChildren="Inactive"
                  style={{ width: 'auto' }}
                  className="status-switch"
                />
              </Form.Item>

              <Form.Item
                label="Follow Up Date"
                name="next_follow_up"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </div>

            <div className="action-buttons">
              <button 
                className="action-button"
                type="submit"
                disabled={submitting}
                style={{ 
                  backgroundColor: primaryColor,
                  borderColor: primaryColor,
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Processing...' : (existingLead ? 'Update Lead' : 'Create Lead')}
              </button>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
};

export default ChatDetails;
