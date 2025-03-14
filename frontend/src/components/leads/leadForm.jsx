import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Divider, Tab, Tabs, Button, List, ListItem, ListItemText, ListItemIcon, Chip, TextField, IconButton, Card, CardContent } from '@mui/material';
import { Form, message, InputNumber, Row, Col, Upload, Select, DatePicker, Checkbox, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FileOutlined, DeleteOutlined, PlusOutlined, PhoneOutlined, MailOutlined, TeamOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// Import form components
import FormSection from '../forms/common/formSection';
import FormTextInput from '../forms/common/formTextInput';
import FormSelect from '../forms/common/formSelect';
import FormTextarea from '../forms/common/formTextarea';
import FormDatePicker from '../forms/common/formDatePicker';
import FormActions from '../forms/common/formActions';

const LeadForm = ({ initialData = {}, isEditMode = false, onSuccess }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [leadType, setLeadType] = useState(initialData.lead_type || 'hajj_package');
  const [productOptions, setProductOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedPackageDetails, setSelectedPackageDetails] = useState(null);
  const [notes, setNotes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  // Add state for form fields to ensure immediate updates
  const [formValues, setFormValues] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    whatsapp: initialData.whatsapp || '',
    last_contacted: initialData.last_contacted ? new Date(initialData.last_contacted) : null,
    next_follow_up: initialData.next_follow_up ? new Date(initialData.next_follow_up) : null,
    lead_type: initialData.lead_type || 'hajj_package',
    source: initialData.source || 'website_form',
    status: initialData.status || 'new',
    lead_activity_status: initialData.lead_activity_status || 'active',
    assigned_to: initialData.assigned_to || null,
  });
  
  // Status options
  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'non_potential', label: 'Non-Potential' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' }
  ];
  
  // Source options
  const sourceOptions = [
    { value: 'fb_form', label: 'FB Form' },
    { value: 'messenger', label: 'Messenger' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'insta_form', label: 'Insta Form' },
    { value: 'website_form', label: 'Website Form' },
    { value: 'website_chat', label: 'Website Chat' },
    { value: 'referral', label: 'Referral' },
    { value: 'walk_in', label: 'Walk In' }
  ];
  
  // Lead type options
  const leadTypeOptions = [
    { value: 'hajj_package', label: 'Hajj Package' },
    { value: 'custom_umrah', label: 'Custom Umrah' },
    { value: 'readymade_umrah', label: 'Readymade Umrah' },
    { value: 'flight', label: 'Flight' },
    { value: 'visa', label: 'Visa' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'ziyarat', label: 'Ziyarat' }
  ];
  
  // Activity status options
  const activityStatusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];
  
  // Document type options based on your model
  const documentTypeOptions = [
    { value: 'passport', label: 'Passport' },
    { value: 'picture', label: 'Picture' },
    { value: 'visa', label: 'Visa' },
    { value: 'makkah_hotel_voucher', label: 'Makkah Hotel Voucher' },
    { value: 'madinah_hotel_voucher', label: 'Madinah Hotel Voucher' },
    { value: 'transfer_voucher', label: 'Transfer Voucher' },
    { value: 'ziyarat_voucher', label: 'Ziyarat Voucher' },
    { value: 'flight_ticket', label: 'Flight Ticket' },
    { value: 'other', label: 'Other' }
  ];
  
  // Activity type options based on your model
  const activityTypeOptions = [
    { value: 'call', label: 'Call' },
    { value: 'email', label: 'Email' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'task', label: 'Task' }
  ];
  
  // Buying level options for profile
  const buyingLevelOptions = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
    { value: 'very_low', label: 'Very Low' }
  ];
  
  // Set initial form values
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      // Parse query_for if it's a string or object
      let queryFor = initialData.query_for || {};
      if (typeof queryFor === 'string') {
        try {
          queryFor = JSON.parse(queryFor);
        } catch (e) {
          queryFor = { notes: queryFor };
        }
      }
      
      const updatedValues = {
        ...initialData,
        // Format dates if needed
        last_contacted: initialData.last_contacted ? new Date(initialData.last_contacted) : null,
        next_follow_up: initialData.next_follow_up ? new Date(initialData.next_follow_up) : null,
        // Set query_for fields
        adults: queryFor.adults || 0,
        children: queryFor.children || 0,
        infants: queryFor.infants || 0,
        query_notes: queryFor.notes || ''
      };
      
      form.setFieldsValue(updatedValues);
      setFormValues(updatedValues);
      
      // Set lead type
      if (initialData.lead_type) {
        setLeadType(initialData.lead_type);
      }
    }
  }, [initialData, form]);
  
  // Fetch product options based on lead type
  useEffect(() => {
    const fetchProductOptions = async () => {
      try {
        let endpoint = '';
        
        // Determine endpoint based on lead type
        switch(leadType) {
          case 'hajj_package':
            endpoint = 'hajj-packages/';
            break;
          case 'custom_umrah':
            endpoint = 'custom-umrah/';
            break;
          case 'readymade_umrah':
            endpoint = 'readymade-umrah/';
            break;
          case 'flight':
            endpoint = 'flights/';
            break;
          case 'visa':
            endpoint = 'visas/';
            break;
          case 'transfer':
            endpoint = 'transfers/';
            break;
          case 'ziyarat':
            endpoint = 'ziyarats/';
            break;
          default:
            endpoint = 'hajj-packages/';
        }
        
        // Only fetch if we have a valid endpoint
        if (endpoint) {
          const response = await api.get(endpoint);
          
          // Process response data
          let itemsArray = Array.isArray(response.data) 
            ? response.data
            : (response.data?.results && Array.isArray(response.data.results))
              ? response.data.results
              : [];
          
          // Map to options format
          const options = itemsArray.map(item => ({
            value: item.id,
            label: item.package_name || item.name || `ID: ${item.id}`
          }));
          
          setProductOptions(options);
        }
      } catch (error) {
        console.error(`Error fetching ${leadType} options:`, error);
        message.error(`Failed to load ${leadType} options`);
      }
    };
    
    fetchProductOptions();
  }, [leadType]);
  
  // Fetch users for assigned_to dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get tenant_id from localStorage
        const tenantId = localStorage.getItem('tenant_id');
        
        if (!tenantId) {
          console.error('No tenant ID found in localStorage');
          return;
        }
        
        // Log the API call for debugging
        console.log(`Fetching users for tenant: ${tenantId}`);
        
        try {
          // Updated path to include auth/ prefix
          const response = await api.get('auth/users/active-by-tenant/', {
            params: {
              tenant: tenantId
            }
          });
          
          console.log('API Response:', response);
          
          // Process response data
          let usersArray = Array.isArray(response.data) 
            ? response.data
            : (response.data?.results && Array.isArray(response.data.results))
              ? response.data.results
              : [];
          
          console.log(`Fetched ${usersArray.length} users`);
          
          // Group users by department
          const usersByDepartment = {};
          
          usersArray.forEach(user => {
            const deptName = user.department_name || 'Other';
            
            if (!usersByDepartment[deptName]) {
              usersByDepartment[deptName] = [];
            }
            
            usersByDepartment[deptName].push({
              value: user.id,
              label: `${user.first_name} ${user.last_name} (${user.email})`
            });
          });
          
          // Convert to options format with department groups
          const options = Object.keys(usersByDepartment).map(dept => ({
            label: dept,
            options: usersByDepartment[dept]
          }));
          
          setUserOptions(options);
        } catch (error) {
          console.error('Error fetching from users endpoint:', error);
          
          // Try a direct fetch to debug the issue with the correct path
          try {
            console.log('Attempting direct fetch to debug...');
            const fullUrl = `http://localhost:8000/api/auth/users/active-by-tenant/?tenant=${tenantId}`;
            console.log('Full URL:', fullUrl);
            
            const response = await fetch(fullUrl, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Direct fetch response:', data);
            
            // Process the data
            const usersArray = Array.isArray(data) ? data : [];
            
            // Group users by department
            const usersByDepartment = {};
            
            usersArray.forEach(user => {
              const deptName = user.department_name || 'Other';
              
              if (!usersByDepartment[deptName]) {
                usersByDepartment[deptName] = [];
              }
              
              usersByDepartment[deptName].push({
                value: user.id,
                label: `${user.first_name} ${user.last_name} (${user.email})`
              });
            });
            
            // Convert to options format with department groups
            const options = Object.keys(usersByDepartment).map(dept => ({
              label: dept,
              options: usersByDepartment[dept]
            }));
            
            setUserOptions(options);
          } catch (directError) {
            console.error('Direct fetch also failed:', directError);
          }
          
          // As a last resort, try to get all users with the correct path
          try {
            console.log('Trying to fetch all users as fallback...');
            const response = await api.get('auth/users/');
            
            let allUsers = Array.isArray(response.data) 
              ? response.data
              : (response.data?.results && Array.isArray(response.data.results))
                ? response.data.results
                : [];
            
            // Filter users by tenant_id manually
            const filteredUsers = allUsers.filter(user => 
              user.tenant_id === tenantId && user.is_active !== false
            );
            
            console.log(`Filtered ${filteredUsers.length} users from ${allUsers.length} total`);
            
            // Group users by department
            const usersByDepartment = {};
            
            filteredUsers.forEach(user => {
              const deptName = user.department_name || 'Other';
              
              if (!usersByDepartment[deptName]) {
                usersByDepartment[deptName] = [];
              }
              
              usersByDepartment[deptName].push({
                value: user.id,
                label: `${user.first_name} ${user.last_name} (${user.email})`
              });
            });
            
            // Convert to options format with department groups
            const options = Object.keys(usersByDepartment).map(dept => ({
              label: dept,
              options: usersByDepartment[dept]
            }));
            
            setUserOptions(options);
          } catch (fallbackError) {
            console.error('All fallback attempts failed:', fallbackError);
            message.error('Failed to load users');
          }
        }
      } catch (error) {
        console.error('Error in fetchUsers:', error);
        message.error('Failed to load users');
      }
    };
    
    fetchUsers();
  }, []);
  
  // Fetch lead notes if in edit mode
  useEffect(() => {
    if (isEditMode && initialData.id) {
      fetchLeadNotes(initialData.id);
    }
  }, [isEditMode, initialData.id]);
  
  // Fetch lead documents if in edit mode
  useEffect(() => {
    if (isEditMode && initialData.id) {
      fetchLeadDocuments(initialData.id);
    }
  }, [isEditMode, initialData.id]);
  
  // Fetch lead activities if in edit mode
  useEffect(() => {
    if (isEditMode && initialData.id) {
      fetchLeadActivities(initialData.id);
    }
  }, [isEditMode, initialData.id]);
  
  // Fetch lead profile if in edit mode
  useEffect(() => {
    if (isEditMode && initialData.id) {
      fetchLeadProfile(initialData.id);
    }
  }, [isEditMode, initialData.id]);
  
  // Function to fetch lead notes
  const fetchLeadNotes = async (leadId) => {
    try {
      setLoadingNotes(true);
      const response = await api.get(`/leads/${leadId}/notes/`);
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching lead notes:', error);
      message.error('Failed to load lead notes');
    } finally {
      setLoadingNotes(false);
    }
  };
  
  // Function to fetch lead documents
  const fetchLeadDocuments = async (leadId) => {
    try {
      setLoadingDocuments(true);
      const response = await api.get(`/leads/${leadId}/documents/`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching lead documents:', error);
      message.error('Failed to load lead documents');
    } finally {
      setLoadingDocuments(false);
    }
  };
  
  // Function to fetch lead activities
  const fetchLeadActivities = async (leadId) => {
    try {
      setLoadingActivities(true);
      const response = await api.get(`/leads/${leadId}/activities/`);
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching lead activities:', error);
      message.error('Failed to load lead activities');
    } finally {
      setLoadingActivities(false);
    }
  };
  
  // Function to fetch lead profile
  const fetchLeadProfile = async (leadId) => {
    try {
      setLoadingProfile(true);
      const response = await api.get(`/leads/${leadId}/profile/`);
      setProfileData(response.data);
    } catch (error) {
      console.error('Error fetching lead profile:', error);
      message.error('Failed to load lead profile');
    } finally {
      setLoadingProfile(false);
    }
  };
  
  // Function to add a new note
  const handleAddNote = async () => {
    if (!newNote.trim() || !isEditMode || !initialData.id) {
      return;
    }
    
    try {
      const response = await api.post(`/leads/${initialData.id}/notes/`, {
        note: newNote
      });
      
      setNotes([response.data, ...notes]);
      setNewNote('');
      message.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      message.error('Failed to add note');
    }
  };
  
  // Function to delete a note
  const handleDeleteNote = async (noteId) => {
    try {
      await api.delete(`/leads/notes/${noteId}/`);
      setNotes(notes.filter(note => note.id !== noteId));
      message.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      message.error('Failed to delete note');
    }
  };
  
  // Function to upload a document
  const handleUploadDocument = async (options) => {
    const { file, onSuccess, onError, onProgress } = options;
    
    if (!isEditMode || !initialData.id) {
      onError('Lead must be saved first');
      return;
    }
    
    const formData = new FormData();
    formData.append('document_path', file);
    formData.append('document_type', file.documentType || 'other');
    formData.append('lead', initialData.id);
    
    try {
      const response = await api.post(`/leads/${initialData.id}/documents/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: ({ total, loaded }) => {
          onProgress({ percent: Math.round((loaded / total) * 100) });
        }
      });
      
      onSuccess(response, file);
      setDocuments([response.data, ...documents]);
      message.success('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      onError(error);
      message.error('Failed to upload document');
    }
  };
  
  // Function to delete a document
  const handleDeleteDocument = async (documentId) => {
    try {
      await api.delete(`/leads/documents/${documentId}/`);
      setDocuments(documents.filter(doc => doc.id !== documentId));
      message.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      message.error('Failed to delete document');
    }
  };
  
  // Function to add a new activity
  const handleAddActivity = async (values) => {
    if (!isEditMode || !initialData.id) {
      message.error('Lead must be saved first');
      return;
    }
    
    try {
      const response = await api.post(`/leads/${initialData.id}/activities/`, {
        ...values,
        lead: initialData.id,
        due_date: values.due_date ? values.due_date.toISOString() : null
      });
      
      setActivities([response.data, ...activities]);
      message.success('Activity added successfully');
      return true;
    } catch (error) {
      console.error('Error adding activity:', error);
      message.error('Failed to add activity');
      return false;
    }
  };
  
  // Function to update lead profile
  const handleUpdateProfile = async (values) => {
    if (!isEditMode || !initialData.id) {
      message.error('Lead must be saved first');
      return;
    }
    
    try {
      const response = await api.put(`/leads/${initialData.id}/profile/`, {
        ...values,
        lead: initialData.id
      });
      
      setProfileData(response.data);
      message.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
      return false;
    }
  };
  
  // Handle lead type change
  const handleLeadTypeChange = (value) => {
    setLeadType(value);
    form.setFieldValue('lead_type', value);
    
    // Clear product selection when type changes
    form.setFieldValue('hajj_package', null);
    form.setFieldValue('custom_umrah', null);
    form.setFieldValue('readymade_umrah', null);
    form.setFieldValue('flight', null);
    form.setFieldValue('visa', null);
    form.setFieldValue('transfer', null);
    form.setFieldValue('ziyarat', null);
    
    // Clear selected package details
    setSelectedPackageDetails(null);
  };
  
  // Add a new function to fetch package details when a package is selected
  const handlePackageSelect = async (value) => {
    if (!value) {
      setSelectedPackageDetails(null);
      return;
    }
    
    try {
      // Set the field value
      form.setFieldValue(getProductFieldName(), value);
      
      // Fetch the package details
      let endpoint = '';
      
      // Determine endpoint based on lead type
      switch(leadType) {
        case 'hajj_package':
          endpoint = `hajj-packages/${value}/`;
          break;
        case 'custom_umrah':
          endpoint = `custom-umrah/${value}/`;
          break;
        case 'readymade_umrah':
          endpoint = `readymade-umrah/${value}/`;
          break;
        case 'flight':
          endpoint = `flights/${value}/`;
          break;
        case 'visa':
          endpoint = `visas/${value}/`;
          break;
        case 'transfer':
          endpoint = `transfers/${value}/`;
          break;
        case 'ziyarat':
          endpoint = `ziyarats/${value}/`;
          break;
        default:
          endpoint = `hajj-packages/${value}/`;
      }
      
      const response = await api.get(endpoint);
      setSelectedPackageDetails(response.data);
    } catch (error) {
      console.error(`Error fetching package details:`, error);
      message.error(`Failed to load package details`);
      setSelectedPackageDetails(null);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Build query_for JSON object from form fields
      const queryFor = {
        adults: values.adults || 0,
        children: values.children || 0,
        infants: values.infants || 0,
        notes: values.query_notes || ''
      };
      
      // Format dates and prepare final form data
      const formattedValues = {
        ...values,
        last_contacted: values.last_contacted ? new Date(values.last_contacted).toISOString() : null,
        next_follow_up: values.next_follow_up ? new Date(values.next_follow_up).toISOString() : null,
        query_for: queryFor
      };
      
      // Remove the individual query fields that aren't in the model
      delete formattedValues.adults;
      delete formattedValues.children;
      delete formattedValues.infants;
      delete formattedValues.query_notes;
      
      // Make API call based on edit mode
      if (isEditMode) {
        await api.put(`/leads/${initialData.id}/`, formattedValues);
        message.success('Lead updated successfully');
      } else {
        await api.post('/leads/', formattedValues);
        message.success('Lead created successfully');
      }
      
      if (onSuccess) onSuccess();
      else navigate('/dashboard/leads');
    } catch (error) {
      console.error('Form submission error:', error);
      message.error('Failed to save lead. Please check the form and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form cancel
  const handleCancel = () => {
    navigate('/dashboard/leads');
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Get product field name based on lead type
  const getProductFieldName = () => {
    switch(leadType) {
      case 'hajj_package': return 'hajj_package';
      case 'custom_umrah': return 'custom_umrah';
      case 'readymade_umrah': return 'readymade_umrah';
      case 'flight': return 'flight';
      case 'visa': return 'visa';
      case 'transfer': return 'transfer';
      case 'ziyarat': return 'ziyarat';
      default: return 'hajj_package';
    }
  };
  
  // Get product field label based on lead type
  const getProductFieldLabel = () => {
    switch(leadType) {
      case 'hajj_package': return 'Select Hajj Package';
      case 'custom_umrah': return 'Select Custom Umrah';
      case 'readymade_umrah': return 'Select Readymade Umrah';
      case 'flight': return 'Select Flight';
      case 'visa': return 'Select Visa';
      case 'transfer': return 'Select Transfer';
      case 'ziyarat': return 'Select Ziyarat';
      default: return 'Select Product';
    }
  };
  
  // Handle input changes for basic fields
  const handleInputChange = (field, value) => {
    // Update both form and local state
    form.setFieldValue(field, value);
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            lead_type: leadType,
            status: 'new',
            source: 'website_form',
            lead_activity_status: 'active',
            adults: 0,
            children: 0,
            infants: 0,
            ...initialData
          }}
          onValuesChange={(changedValues, allValues) => {
            // Update formValues when form values change
            setFormValues(prev => ({
              ...prev,
              ...changedValues
            }));
          }}
        >
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Basic" value="basic" />
            <Tab label="Product" value="product" />
            <Tab label="Notes" value="notes" />
            <Tab label="Documents" value="documents" />
            <Tab label="Activities" value="activities" />
            <Tab label="Profile" value="profile" />
          </Tabs>
          
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <FormSection title="Lead Information">
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormTextInput
                    label="Full Name"
                    name="name"
                    value={formValues.name}
                    onChange={(value) => handleInputChange('name', value)}
                    required
                    placeholder="Enter lead's full name"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormTextInput
                    label="Email"
                    name="email"
                    value={formValues.email}
                    onChange={(value) => handleInputChange('email', value)}
                    placeholder="Enter email address"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormTextInput
                    label="Phone"
                    name="phone"
                    value={formValues.phone}
                    onChange={(value) => handleInputChange('phone', value)}
                    required
                    placeholder="Enter phone number"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormTextInput
                    label="WhatsApp"
                    name="whatsapp"
                    value={formValues.whatsapp}
                    onChange={(value) => handleInputChange('whatsapp', value)}
                    placeholder="Enter WhatsApp number (if different)"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormSelect
                    label="Lead Type"
                    name="lead_type"
                    value={formValues.lead_type}
                    onChange={(value) => {
                      handleInputChange('lead_type', value);
                      handleLeadTypeChange(value);
                    }}
                    options={leadTypeOptions}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormSelect
                    label="Lead Source"
                    name="source"
                    value={formValues.source}
                    onChange={(value) => handleInputChange('source', value)}
                    options={sourceOptions}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormSelect
                    label="Status"
                    name="status"
                    value={formValues.status}
                    onChange={(value) => handleInputChange('status', value)}
                    options={statusOptions}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormSelect
                    label="Activity Status"
                    name="lead_activity_status"
                    value={formValues.lead_activity_status}
                    onChange={(value) => handleInputChange('lead_activity_status', value)}
                    options={activityStatusOptions}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormDatePicker
                    label="Last Contacted"
                    name="last_contacted"
                    value={formValues.last_contacted}
                    onChange={(value) => handleInputChange('last_contacted', value)}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormDatePicker
                    label="Next Follow-up"
                    name="next_follow_up"
                    value={formValues.next_follow_up}
                    onChange={(value) => handleInputChange('next_follow_up', value)}
                    minDate={new Date()}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormSelect
                    label="Assigned To"
                    name="assigned_to"
                    value={formValues.assigned_to}
                    onChange={(value) => handleInputChange('assigned_to', value)}
                    options={userOptions}
                    placeholder="Select user to assign"
                    groupedOptions={true}
                  />
                </Grid>
              </Grid>
            </FormSection>
          )}
          
          {/* Product Details Tab */}
          {activeTab === 'product' && (
            <FormSection title="Product Information">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormSelect
                    label={getProductFieldLabel()}
                    name={getProductFieldName()}
                    value={formValues[getProductFieldName()]}
                    onChange={(value) => handlePackageSelect(value)}
                    options={productOptions}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 2, mt: 2 }}>
                    Query Details
                  </Typography>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item 
                        label="Adults" 
                        name="adults"
                        rules={[{ type: 'number', min: 0 }]}
                      >
                        <InputNumber 
                          min={0} 
                          style={{ width: '100%' }} 
                          placeholder="Number of adults"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item 
                        label="Children" 
                        name="children"
                        rules={[{ type: 'number', min: 0 }]}
                      >
                        <InputNumber 
                          min={0} 
                          style={{ width: '100%' }} 
                          placeholder="Number of children"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item 
                        label="Infants" 
                        name="infants"
                        rules={[{ type: 'number', min: 0 }]}
                      >
                        <InputNumber 
                          min={0} 
                          style={{ width: '100%' }} 
                          placeholder="Number of infants"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Grid>
                
                {/* Package Details Section */}
                {selectedPackageDetails && (
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 3, 
                        mt: 2, 
                        backgroundColor: '#f9f9f9', 
                        border: '1px solid #e0e0e0',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 2, color: '#9d277c', fontWeight: 'bold' }}>
                        {selectedPackageDetails.package_name || 'Package Details'}
                      </Typography>
                      
                      {/* Selling Price Banner */}
                      <Box sx={{ 
                        backgroundColor: '#9d277c', 
                        color: 'white', 
                        p: 1.5, 
                        borderRadius: 1, 
                        mb: 3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          Selling Price:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {selectedPackageDetails.selling_price ? 
                            selectedPackageDetails.selling_price.toLocaleString() : 
                            (selectedPackageDetails.total_cost ? 
                              selectedPackageDetails.total_cost.toLocaleString() : 'Contact for pricing')}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ mb: 3 }} />
                      
                      {/* Hajj Details Section */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: '#333' }}>
                          Hajj Details:
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', width: 120 }}>
                                Package Star:
                              </Typography>
                              <Typography variant="body2">
                                {selectedPackageDetails.package_star || '2'} Star
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', width: 120 }}>
                                Hajj Days:
                              </Typography>
                              <Typography variant="body2">
                                {selectedPackageDetails.hajj_days || '7'}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', width: 120 }}>
                                Departure Date:
                              </Typography>
                              <Typography variant="body2">
                                {selectedPackageDetails.departure_date ? 
                                  new Date(selectedPackageDetails.departure_date).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  }) : 'N/A'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', width: 120 }}>
                                Return Date:
                              </Typography>
                              <Typography variant="body2">
                                {selectedPackageDetails.return_date ? 
                                  new Date(selectedPackageDetails.return_date).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  }) : 'N/A'}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', width: 120 }}>
                                Makatb #:
                              </Typography>
                              <Typography variant="body2">
                                {selectedPackageDetails.maktab_no || 'B'}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                      
                      <Divider sx={{ mb: 3 }} />
                      
                      {/* Accommodation Details Section */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>
                          Accommodation Details:
                        </Typography>
                        
                        <Grid container spacing={3}>
                          {/* Makkah Column */}
                          <Grid item xs={12} md={6}>
                            <Paper 
                              elevation={0} 
                              sx={{ 
                                p: 2, 
                                backgroundColor: 'white', 
                                border: '1px solid #e0e0e0',
                                height: '100%'
                              }}
                            >
                              <Typography variant="subtitle2" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold', color: '#9d277c' }}>
                                Makkah
                              </Typography>
                              
                              {/* Hotel Name with emphasis */}
                              <Box sx={{ 
                                mb: 2, 
                                p: 1, 
                                backgroundColor: '#f5f5f5', 
                                borderRadius: 1,
                                textAlign: 'center'
                              }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#333' }}>
                                  {selectedPackageDetails.hotel_makkah || 'Hotel information not available'}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', width: 100 }}>
                                  Star:
                                </Typography>
                                <Typography variant="body2">
                                  {selectedPackageDetails.makkah_star || '2'} Star
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', width: 100 }}>
                                  Check In:
                                </Typography>
                                <Typography variant="body2">
                                  {selectedPackageDetails.makkah_check_in ? 
                                    new Date(selectedPackageDetails.makkah_check_in).toLocaleDateString('en-US', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    }) : 
                                    selectedPackageDetails.departure_date ? 
                                      new Date(selectedPackageDetails.departure_date).toLocaleDateString('en-US', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      }) : 'N/A'}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', width: 100 }}>
                                  Check Out:
                                </Typography>
                                <Typography variant="body2">
                                  {selectedPackageDetails.makkah_check_out ? 
                                    new Date(selectedPackageDetails.makkah_check_out).toLocaleDateString('en-US', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    }) : '4 Jun 2025'}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', width: 100 }}>
                                  Room Type:
                                </Typography>
                                <Typography variant="body2">
                                  {selectedPackageDetails.makkah_room_type || 'Quad'}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', width: 100 }}>
                                  Nights:
                                </Typography>
                                <Typography variant="body2">
                                  {selectedPackageDetails.makkah_nights || '4'}
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                          
                          {/* Madinah Column */}
                          <Grid item xs={12} md={6}>
                            <Paper 
                              elevation={0} 
                              sx={{ 
                                p: 2, 
                                backgroundColor: 'white', 
                                border: '1px solid #e0e0e0',
                                height: '100%'
                              }}
                            >
                              <Typography variant="subtitle2" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold', color: '#9d277c' }}>
                                Madinah
                              </Typography>
                              
                              {/* Hotel Name with emphasis */}
                              <Box sx={{ 
                                mb: 2, 
                                p: 1, 
                                backgroundColor: '#f5f5f5', 
                                borderRadius: 1,
                                textAlign: 'center'
                              }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#333' }}>
                                  {selectedPackageDetails.hotel_madinah || 'Hotel information not available'}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', width: 100 }}>
                                  Star:
                                </Typography>
                                <Typography variant="body2">
                                  {selectedPackageDetails.madinah_star || '2'} Star
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', width: 100 }}>
                                  Check In:
                                </Typography>
                                <Typography variant="body2">
                                  {selectedPackageDetails.madinah_check_in ? 
                                    new Date(selectedPackageDetails.madinah_check_in).toLocaleDateString('en-US', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    }) : '28 May 2025'}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', width: 100 }}>
                                  Check Out:
                                </Typography>
                                <Typography variant="body2">
                                  {selectedPackageDetails.madinah_check_out ? 
                                    new Date(selectedPackageDetails.madinah_check_out).toLocaleDateString('en-US', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    }) : '4 Jun 2025'}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', width: 100 }}>
                                  Room Type:
                                </Typography>
                                <Typography variant="body2">
                                  {selectedPackageDetails.madinah_room_type || 'Quad'}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', width: 100 }}>
                                  Nights:
                                </Typography>
                                <Typography variant="body2">
                                  {selectedPackageDetails.madinah_nights || '4'}
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                      
                      <Divider sx={{ mb: 3 }} />
                      
                      {/* Additional Details Section */}
                      <Box>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>
                          Additional Details:
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', width: 80 }}>
                                Visa:
                              </Typography>
                              <Typography variant="body2">
                                {selectedPackageDetails.visa === 'included' ? 'Included' : 'Not Included'}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', width: 80 }}>
                                Ziyarat:
                              </Typography>
                              <Typography variant="body2">
                                {selectedPackageDetails.ziyarat === 'makkah_medinah' ? 'Makkah & Madinah' : 'Not Included'}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', width: 80 }}>
                                Flight:
                              </Typography>
                              <Typography variant="body2">
                                {selectedPackageDetails.flight_carrier || 'Emirates'}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        
                        {/* Base Price section (if different from selling price) */}
                        {selectedPackageDetails.total_cost && selectedPackageDetails.selling_price && 
                         selectedPackageDetails.total_cost !== selectedPackageDetails.selling_price && (
                          <Box sx={{ mt: 3, textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              Base Price: {selectedPackageDetails.total_cost.toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                )}
                
                {/* Notes field moved to the query_for JSON */}
                <Grid item xs={12}>
                  <Form.Item 
                    label="Query Notes" 
                    name="query_notes"
                  >
                    <FormTextarea
                      placeholder="Enter any additional notes about the query"
                      rows={3}
                    />
                  </Form.Item>
                </Grid>
              </Grid>
            </FormSection>
          )}
          
          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <FormSection title="Lead Notes">
              {isEditMode ? (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 3, display: 'flex' }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        placeholder="Add a new note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        sx={{ mr: 2 }}
                      />
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        sx={{ alignSelf: 'flex-end' }}
                      >
                        Add Note
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    {loadingNotes ? (
                      <Typography>Loading notes...</Typography>
                    ) : notes.length > 0 ? (
                      <List>
                        {notes.map((note) => (
                          <Paper key={note.id} sx={{ mb: 2, p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                {note.added_by_name || 'Unknown'} - {new Date(note.timestamp).toLocaleString()}
                              </Typography>
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteNote(note.id)}
                                aria-label="delete note"
                              >
                                <DeleteOutlined />
                              </IconButton>
                            </Box>
                            <Typography variant="body1">{note.note}</Typography>
                          </Paper>
                        ))}
                      </List>
                    ) : (
                      <Typography color="text.secondary">No notes yet. Add your first note above.</Typography>
                    )}
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">
                  Save the lead first to add notes.
                </Typography>
              )}
            </FormSection>
          )}
          
          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <FormSection title="Lead Documents">
              {isEditMode ? (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Upload.Dragger
                      name="document_path"
                      customRequest={handleUploadDocument}
                      showUploadList={false}
                      beforeUpload={(file) => {
                        // Show a modal to select document type
                        return new Promise((resolve, reject) => {
                          Modal.confirm({
                            title: 'Select Document Type',
                            content: (
                              <Select
                                style={{ width: '100%' }}
                                placeholder="Select document type"
                                options={documentTypeOptions}
                                onChange={(value) => {
                                  file.documentType = value;
                                  resolve(file);
                                }}
                              />
                            ),
                            onCancel: () => reject(),
                          });
                        });
                      }}
                    >
                      <p className="ant-upload-drag-icon">
                        <FileOutlined />
                      </p>
                      <p className="ant-upload-text">Click or drag file to this area to upload</p>
                      <p className="ant-upload-hint">
                        Support for a single or bulk upload. Strictly prohibited from uploading company data or other
                        banned files.
                      </p>
                    </Upload.Dragger>
                  </Grid>
                  
                  <Grid item xs={12}>
                    {loadingDocuments ? (
                      <Typography>Loading documents...</Typography>
                    ) : documents.length > 0 ? (
                      <Table
                        dataSource={documents}
                        rowKey="id"
                        columns={[
                          {
                            title: 'Document Type',
                            dataIndex: 'document_type',
                            key: 'document_type',
                            render: (text) => {
                              const option = documentTypeOptions.find(opt => opt.value === text);
                              return option ? option.label : text;
                            }
                          },
                          {
                            title: 'Uploaded By',
                            dataIndex: 'uploaded_by_name',
                            key: 'uploaded_by_name',
                            render: (text) => text || 'Unknown'
                          },
                          {
                            title: 'Date',
                            dataIndex: 'timestamp',
                            key: 'timestamp',
                            render: (text) => new Date(text).toLocaleString()
                          },
                          {
                            title: 'Actions',
                            key: 'actions',
                            render: (_, record) => (
                              <Space>
                                <Button 
                                  type="link" 
                                  onClick={() => window.open(record.document_path, '_blank')}
                                >
                                  View
                                </Button>
                                <Button 
                                  type="link" 
                                  danger 
                                  onClick={() => handleDeleteDocument(record.id)}
                                >
                                  Delete
                                </Button>
                              </Space>
                            )
                          }
                        ]}
                      />
                    ) : (
                      <Typography color="text.secondary">No documents yet. Upload your first document above.</Typography>
                    )}
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">
                  Save the lead first to add documents.
                </Typography>
              )}
            </FormSection>
          )}
          
          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <FormSection title="Lead Activities">
              {isEditMode ? (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>Add New Activity</Typography>
                        <Form
                          name="activity_form"
                          layout="vertical"
                          onFinish={handleAddActivity}
                        >
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                name="activity_type"
                                label="Activity Type"
                                rules={[{ required: true, message: 'Please select activity type' }]}
                              >
                                <Select
                                  placeholder="Select activity type"
                                  options={activityTypeOptions}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="due_date"
                                label="Due Date"
                                rules={[{ required: false }]}
                              >
                                <DatePicker showTime style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Form.Item
                            name="description"
                            label="Description"
                            rules={[{ required: true, message: 'Please enter description' }]}
                          >
                            <Input.TextArea rows={3} />
                          </Form.Item>
                          <Form.Item
                            name="duration"
                            label="Duration (minutes)"
                            rules={[{ required: false }]}
                          >
                            <InputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item>
                            <Button type="primary" htmlType="submit">
                              Add Activity
                            </Button>
                          </Form.Item>
                        </Form>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12}>
                    {loadingActivities ? (
                      <Typography>Loading activities...</Typography>
                    ) : activities.length > 0 ? (
                      <List>
                        {activities.map((activity) => (
                          <Paper key={activity.id} sx={{ mb: 2, p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Box>
                                <Chip 
                                  label={activityTypeOptions.find(opt => opt.value === activity.activity_type)?.label || activity.activity_type} 
                                  color="primary" 
                                  size="small" 
                                  sx={{ mr: 1 }}
                                />
                                {activity.activity_type === 'task' && (
                                  <Chip 
                                    label={activity.completed ? 'Completed' : 'Pending'} 
                                    color={activity.completed ? 'success' : 'warning'} 
                                    size="small" 
                                  />
                                )}
                              </Box>
                              <Typography variant="caption">
                                {new Date(activity.created_at).toLocaleString()}
                              </Typography>
                            </Box>
                            
                            <Typography variant="body1" sx={{ mb: 1 }}>{activity.description}</Typography>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                {activity.duration && (
                                  <Typography variant="body2" color="text.secondary">
                                    Duration: {activity.duration} minutes
                                  </Typography>
                                )}
                                {activity.due_date && (
                                  <Typography variant="body2" color="text.secondary">
                                    Due: {new Date(activity.due_date).toLocaleString()}
                                  </Typography>
                                )}
                              </Box>
                              
                              <Box>
                                {activity.activity_type === 'task' && !activity.completed && (
                                  <Button 
                                    size="small" 
                                    startIcon={<CheckOutlined />}
                                    onClick={() => {
                                      api.put(`/leads/activities/${activity.id}/`, {
                                        ...activity,
                                        completed: true,
                                        completed_at: new Date().toISOString()
                                      }).then(() => {
                                        fetchLeadActivities(initialData.id);
                                        message.success('Task marked as completed');
                                      }).catch(error => {
                                        console.error('Error updating activity:', error);
                                        message.error('Failed to update activity');
                                      });
                                    }}
                                  >
                                    Mark Complete
                                  </Button>
                                )}
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </List>
                    ) : (
                      <Typography color="text.secondary">No activities yet. Add your first activity above.</Typography>
                    )}
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">
                  Save the lead first to add activities.
                </Typography>
              )}
            </FormSection>
          )}
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <FormSection title="Lead Profile">
              {isEditMode ? (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Form
                      name="profile_form"
                      layout="vertical"
                      initialValues={profileData || {
                        qualified_lead: false,
                        buying_level: 'medium',
                        previous_purchase: false,
                        previous_purchase_amount: null,
                        engagement_score: 0,
                        response_time_score: 0,
                        budget_match_score: 0
                      }}
                      onFinish={handleUpdateProfile}
                    >
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item
                            name="qualified_lead"
                            valuePropName="checked"
                          >
                            <Checkbox>Qualified Lead</Checkbox>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="previous_purchase"
                            valuePropName="checked"
                          >
                            <Checkbox>Previous Purchase</Checkbox>
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item
                            name="buying_level"
                            label="Buying Level"
                            rules={[{ required: true, message: 'Please select buying level' }]}
                          >
                            <Select
                              placeholder="Select buying level"
                              options={buyingLevelOptions}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="previous_purchase_amount"
                            label="Previous Purchase Amount"
                            dependencies={['previous_purchase']}
                            rules={[
                              ({ getFieldValue }) => ({
                                required: getFieldValue('previous_purchase'),
                                message: 'Please enter previous purchase amount'
                              })
                            ]}
                          >
                            <InputNumber
                              style={{ width: '100%' }}
                              min={0}
                              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              parser={value => value.replace(/\$\s?|(,*)/g, '')}
                              disabled={Form.useWatch('previous_purchase', form) === false}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      <Typography variant="subtitle1" sx={{ mt: 2, mb: 2 }}>Scoring</Typography>
                      
                      <Row gutter={24}>
                        <Col span={8}>
                          <Form.Item
                            name="engagement_score"
                            label="Engagement Score (0-100)"
                            rules={[
                              { required: true, message: 'Please enter engagement score' },
                              { type: 'number', min: 0, max: 100, message: 'Score must be between 0 and 100' }
                            ]}
                          >
                            <InputNumber style={{ width: '100%' }} min={0} max={100} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="response_time_score"
                            label="Response Time Score (0-100)"
                            rules={[
                              { required: true, message: 'Please enter response time score' },
                              { type: 'number', min: 0, max: 100, message: 'Score must be between 0 and 100' }
                            ]}
                          >
                            <InputNumber style={{ width: '100%' }} min={0} max={100} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="budget_match_score"
                            label="Budget Match Score (0-100)"
                            rules={[
                              { required: true, message: 'Please enter budget match score' },
                              { type: 'number', min: 0, max: 100, message: 'Score must be between 0 and 100' }
                            ]}
                          >
                            <InputNumber style={{ width: '100%' }} min={0} max={100} />
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      {profileData && (
                        <Box sx={{ mb: 3, mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            Overall Score: <strong>{profileData.overall_score}/100</strong>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            This score is calculated automatically based on the values above and other factors.
                          </Typography>
                        </Box>
                      )}
                      
                      <Form.Item>
                        <Button type="primary" htmlType="submit">
                          {profileData ? 'Update Profile' : 'Create Profile'}
                        </Button>
                      </Form.Item>
                    </Form>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">
                  Save the lead first to manage profile information.
                </Typography>
              )}
            </FormSection>
          )}
          
          <FormActions
            loading={loading}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </Form>
      </Paper>
    </Box>
  );
};

export default LeadForm;