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

  // Primary color of the app
  const primaryColor = '#9d277c'; // Your app's primary color

  // Check for existing lead when chat is opened
  useEffect(() => {
    const checkExistingLead = async () => {
      if (!activeChat?.id) {
        console.log('No active chat available');
        return;
      }

      try {
        setLoading(true);
        const tenantId = localStorage.getItem('tenant_id');
        
        // First check if there's a lead specifically tied to this WhatsApp contact
        try {
          const whatsAppLeadResponse = await api.get(`/api/waba/lead/${activeChat.id}/`, {
            params: { tenant_id: tenantId }
          });
          
          if (whatsAppLeadResponse.status === 200) {
            console.log('Found WhatsApp lead:', whatsAppLeadResponse.data);
            setExistingLead(whatsAppLeadResponse.data);
            
            // Populate form with existing lead data
            const formData = {
              name: whatsAppLeadResponse.data.name,
              email: whatsAppLeadResponse.data.email,
              phone: whatsAppLeadResponse.data.phone,
              lead_type: whatsAppLeadResponse.data.lead_type,
              status: whatsAppLeadResponse.data.status,
              source: whatsAppLeadResponse.data.source || 'whatsapp',
              assigned_to: whatsAppLeadResponse.data.assigned_to_id,
              lead_activity_status: whatsAppLeadResponse.data.lead_activity_status === 'active',
              next_follow_up: whatsAppLeadResponse.data.next_follow_up ? dayjs(whatsAppLeadResponse.data.next_follow_up) : null
            };
            
            form.setFieldsValue(formData);
            setLoading(false);
            return;
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

          // Populate form with existing lead data
          const formData = {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            lead_type: lead.lead_type,
            status: lead.status,
            source: lead.source || 'whatsapp',
            assigned_to: lead.assigned_to,
            lead_activity_status: lead.lead_activity_status === 'active',
            next_follow_up: lead.next_follow_up ? dayjs(lead.next_follow_up) : null
          };

          console.log('Setting form data:', formData);
          form.setFieldsValue(formData);
        } else {
          console.log('No existing lead found, will create new');
          // Reset form for new lead
          form.setFieldsValue({
            name: activeChat.name || '',
            phone: activeChat.phone || '',
            email: '',
            lead_type: 'new',
            status: 'new',
            source: 'whatsapp',
            lead_activity_status: true
          });
        }
      } catch (error) {
        console.error('Error checking for existing lead:', error);
        message.error('Failed to check lead information');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && activeChat?.id) {
      checkExistingLead();
    }
  }, [activeChat?.id, activeChat?.phone, isOpen, form]);

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

      const endpoints = [
        { url: 'auth/users/', description: 'Auth prefix endpoint' },
        { url: 'users/', description: 'Direct users endpoint' }
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch users from ${endpoint.description}...`);
          const response = await api.get(endpoint.url, {
            params: {
              tenant: tenantId,
              is_active: true
            }
          });

          let userData = [];
          if (Array.isArray(response.data)) {
            userData = response.data;
          } else if (response.data?.results && Array.isArray(response.data.results)) {
            userData = response.data.results;
          }

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
          setDepartmentUsers(usersByDepartment);
          setUsers(userData);
          setLoading(false);
          break;

        } catch (error) {
          console.log(`${endpoint.description} failed:`, error.response?.status || error.message);
          
          if (error.response?.status !== 404 || endpoint === endpoints[endpoints.length - 1]) {
            message.error('Failed to load users');
            setLoading(false);
          }
        }
      }
    };

    fetchUsers();
  }, []);

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
        assigned_to: values.assigned_to,
        lead_activity_status: values.lead_activity_status ? 'active' : 'inactive',
        next_follow_up: values.next_follow_up?.format('YYYY-MM-DD')
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
                  placeholder={loading ? "Loading users..." : "Select user"}
                  loading={loading}
                  showSearch
                  optionFilterProp="children"
                >
                  {Object.entries(departmentUsers).map(([department, deptUsers]) => (
                    <Select.OptGroup key={department} label={department}>
                      {deptUsers.map(user => (
                        <Select.Option 
                          key={user.id} 
                          value={user.id}
                        >
                          {`${user.first_name} ${user.last_name}`.trim() || user.email}
                        </Select.Option>
                      ))}
                    </Select.OptGroup>
                  ))}
                </Select>
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
