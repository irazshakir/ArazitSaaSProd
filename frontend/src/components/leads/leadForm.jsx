import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Divider, Tab, Tabs, Button, List, ListItem, ListItemText, ListItemIcon, Chip, TextField, IconButton, Card, CardContent, CircularProgress } from '@mui/material';
import { 
  Form, message, InputNumber, Row, Col, 
  Upload, Select, DatePicker, Checkbox, Table, Tag, Space, Modal, Input
} from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FileOutlined, DeleteOutlined, PlusOutlined, PhoneOutlined, MailOutlined, TeamOutlined, CheckOutlined, UploadOutlined, MinusCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// Import form components
import FormSection from '../forms/common/formSection';
import FormTextInput from '../forms/common/formTextInput';
import FormSelect from '../forms/common/formSelect';
import FormTextarea from '../forms/common/formTextarea';
import FormDatePicker from '../forms/common/formDatePicker';
import FormActions from '../forms/common/formActions';
import LeadDocuments from './components/leadDocuments';
import LeadActivities from './components/leadActivities';

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
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [submittingDocuments, setSubmittingDocuments] = useState(false);
  
  // Add this state to track form values directly
  const [formValues, setFormValues] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    whatsapp: initialData.whatsapp || '',
    lead_type: initialData.lead_type || 'hajj_package',
    source: initialData.source || 'website_form',
    status: initialData.status || 'new',
    lead_activity_status: initialData.lead_activity_status || 'active',
    last_contacted: initialData.last_contacted || null,
    next_follow_up: initialData.next_follow_up || null,
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
      
      // Check if dates are already dayjs objects
      const isDayjsObject = (obj) => obj && typeof obj === 'object' && typeof obj.isValid === 'function';
      
      const updatedValues = {
        ...initialData,
        // Format dates as dayjs objects for Ant Design DatePicker if they aren't already
        last_contacted: initialData.last_contacted ? 
          (isDayjsObject(initialData.last_contacted) ? 
            initialData.last_contacted : 
            dayjs(initialData.last_contacted)) : 
          null,
        next_follow_up: initialData.next_follow_up ? 
          (isDayjsObject(initialData.next_follow_up) ? 
            initialData.next_follow_up : 
            dayjs(initialData.next_follow_up)) : 
          null,
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
  
  // Function to fetch lead notes
  const fetchLeadNotes = async (leadId) => {
    try {
      setLoadingNotes(true);
      
      // Try the standard endpoint first
      try {
        const response = await api.get(`/leads/${leadId}/notes/`);
        
        // Handle different response structures
        let notesArray = [];
        if (Array.isArray(response.data)) {
          notesArray = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Check if response.data has a results property (common in paginated APIs)
          if (Array.isArray(response.data.results)) {
            notesArray = response.data.results;
          } else {
            // If it's a single note object, wrap it in an array
            notesArray = [response.data];
          }
        }
        
        // Filter notes to ensure they belong to this lead
        notesArray = notesArray.filter(note => {
          const noteLeadId = note.lead || note.lead_id || (note.lead && note.lead.id);
          return noteLeadId === leadId || noteLeadId === leadId.toString();
        });
        
        setNotes(notesArray);
      } catch (endpointError) {
        // Try alternative endpoint with explicit filtering
        try {
          const altResponse = await api.get(`/lead-notes/?lead=${leadId}`);
          
          let notesArray = [];
          if (Array.isArray(altResponse.data)) {
            notesArray = altResponse.data;
          } else if (altResponse.data && typeof altResponse.data === 'object') {
            if (Array.isArray(altResponse.data.results)) {
              notesArray = altResponse.data.results;
            } else {
              notesArray = [altResponse.data];
            }
          }
          
          // Double-check filtering even though the API should have filtered
          notesArray = notesArray.filter(note => {
            const noteLeadId = note.lead || note.lead_id || (note.lead && note.lead.id);
            return noteLeadId === leadId || noteLeadId === leadId.toString();
          });
          
          setNotes(notesArray);
        } catch (altError) {
          setNotes([]);
        }
      }
    } catch (error) {
      message.error('Failed to load lead notes');
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };
  
  // Function to fetch lead documents
  const fetchLeadDocuments = async (leadId) => {
    try {
      // Make sure we have a valid leadId
      if (!leadId) {
        console.error('No lead ID provided for fetching documents');
        return;
      }
      
      console.log(`Fetching documents for lead: ${leadId}`);
      
      // Use the lead ID to filter documents
      const response = await api.get(`/lead-documents/?lead=${leadId}`);
      
      // Process response data
      let documentsArray = Array.isArray(response.data) 
        ? response.data
        : (response.data?.results && Array.isArray(response.data.results))
          ? response.data.results
          : [];
      
      console.log(`Retrieved ${documentsArray.length} documents for lead ${leadId}`);
      
      // Set the documents state
      setDocuments(documentsArray);
    } catch (error) {
      console.error('Error fetching documents:', error);
      message.error('Failed to load documents');
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
  
  // Function to add a new note
  const handleAddNote = async () => {
    if (!newNote.trim() || !isEditMode || !initialData.id) {
      return;
    }
    
    try {
      // Get required IDs from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      const userId = localStorage.getItem('user_id');
      
      if (!tenantId || !userId) {
        message.error("Authentication error: Missing tenant or user ID");
        return;
      }
      
      // Create complete request payload with all required fields
      const requestPayload = {
        note: newNote,
        lead: initialData.id,
        tenant: tenantId,
        added_by: userId
      };
      
      // Make the API request with the complete payload
      const response = await api.post(`/leads/${initialData.id}/add-note/`, requestPayload);
      
      // Verify the lead ID in the response
      const responseLeadId = response.data.lead || response.data.lead_id;
      
      if (responseLeadId && (responseLeadId === initialData.id || responseLeadId === initialData.id.toString())) {
        // Only add to the notes array if it's for the current lead
        const currentNotes = Array.isArray(notes) ? notes : [];
        setNotes([response.data, ...currentNotes]);
      }
      
      // Clear the input field
      setNewNote('');
      message.success('Note added successfully');
      
      // Refresh the notes list to ensure we have the latest data
      setTimeout(() => {
        fetchLeadNotes(initialData.id);
      }, 500);
    } catch (error) {
      message.error('Failed to add note');
    }
  };
  
  // Function to delete a note
  const handleDeleteNote = async (noteId) => {
    try {
      await api.delete(`/lead-notes/${noteId}/`);
      setNotes(notes.filter(note => note.id !== noteId));
      message.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      console.error('Error details:', error.response?.data);
      message.error('Failed to delete note');
    }
  };
  
  // Function to upload a document
  const handleUploadDocument = async (options) => {
    const { file, onSuccess, onError } = options;
    
    try {
      // Get tenant ID from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = user.tenant_id;
      
      if (!tenantId) {
        console.error('Tenant ID not found in localStorage');
        message.error('Tenant information not available. Please log in again.');
        onError('Tenant information not available');
        return;
      }
      
      const formData = new FormData();
      // Use document_name instead of document_type
      formData.append('document_name', file.documentName || 'Unnamed Document');
      formData.append('lead', initialData.id);
      formData.append('tenant', tenantId);
      formData.append('document_path', file);
      
      // Use the correct endpoint from urls.py
      const response = await api.post(`/leads/${initialData.id}/upload-document/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Refresh documents list
      fetchLeadDocuments(initialData.id);
      
      message.success('Document uploaded successfully');
      onSuccess(response.data);
    } catch (error) {
      console.error('Error uploading document:', error);
      message.error('Failed to upload document');
      onError('Upload failed');
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
  
  // Add this function before handleSubmit
  const validateRequiredData = () => {
    const tenantId = localStorage.getItem('tenant_id');
    const currentUserId = localStorage.getItem('user_id');
    
    if (!tenantId) {
      message.error('Tenant ID is missing. Please log in again.');
      return false;
    }
    
    if (!currentUserId) {
      message.error('User ID is missing. Please log in again.');
      return false;
    }
    
    return true;
  };
  
  // Add this function to help debug field name mismatches
  const checkFieldNameMatches = () => {
    console.log('Checking field name matches...');
    
    // Expected field names from your Lead model
    const expectedFields = [
      'name', 'email', 'phone', 'whatsapp', 'lead_type', 'source', 
      'status', 'lead_activity_status', 'last_contacted', 'next_follow_up', 
      'assigned_to', 'tenant', 'created_by', 'hajj_package', 'query_for'
    ];
    
    // Get actual field names from the form
    const formFields = Object.keys(form.getFieldsValue());
    
    console.log('Expected fields:', expectedFields);
    console.log('Form fields:', formFields);
    
    // Check for missing fields
    const missingFields = expectedFields.filter(field => !formFields.includes(field));
    if (missingFields.length > 0) {
      console.warn('Missing fields in form:', missingFields);
    }
    
    // Check for extra fields
    const extraFields = formFields.filter(field => !expectedFields.includes(field));
    if (extraFields.length > 0) {
      console.warn('Extra fields in form:', extraFields);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate form fields
      await form.validateFields();
      setLoading(true);
      
      // Get the form values directly
      const formValues = form.getFieldsValue(true);
      console.log('Direct form values:', formValues);
      
      // Check if dates are dayjs objects and convert them to ISO strings
      const isDayjsObject = (obj) => obj && typeof obj === 'object' && typeof obj.isValid === 'function';
      
      // Create the lead data object
      const leadData = {
        name: formValues.name,
        email: formValues.email || null,
        phone: formValues.phone,
        whatsapp: formValues.whatsapp || null,
        lead_type: formValues.lead_type,
        source: formValues.source,
        status: formValues.status,
        lead_activity_status: formValues.lead_activity_status,
        // Convert dayjs objects to ISO strings for API
        last_contacted: formValues.last_contacted ? 
          (isDayjsObject(formValues.last_contacted) ? 
            formValues.last_contacted.toISOString() : 
            new Date(formValues.last_contacted).toISOString()) : 
          null,
        next_follow_up: formValues.next_follow_up ? 
          (isDayjsObject(formValues.next_follow_up) ? 
            formValues.next_follow_up.toISOString() : 
            new Date(formValues.next_follow_up).toISOString()) : 
          null,
        assigned_to: formValues.assigned_to,
        tenant: localStorage.getItem('tenant_id'),
        created_by: localStorage.getItem('user_id'),
        hajj_package: formValues.hajj_package || null,
        query_for: {
          adults: formValues.adults || 0,
          children: formValues.children || 0,
          infants: formValues.infants || 0,
          notes: formValues.query_notes || ''
        },
        tags: null,
        custom_fields: null
      };
      
      console.log('Final lead data to submit:', leadData);
      
      // Make API call based on edit mode
      if (isEditMode) {
        const response = await api.put(`/leads/${initialData.id}/`, leadData);
        console.log('Update response:', response.data);
        message.success('Lead updated successfully');
      } else {
        const response = await api.post('/leads/', leadData);
        console.log('Create response:', response.data);
        message.success('Lead created successfully');
      }
      
      if (onSuccess) onSuccess();
      else navigate('/dashboard/leads');
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Error handling
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
    // Prevent default behavior of the event
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    
    // Update the active tab state
    setActiveTab(newValue);
    
    // Update URL without causing a page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newValue);
    window.history.pushState({}, '', url);
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
    form.setFieldsValue({ [field]: value });
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/auth/users/me/');
        setCurrentUser(response.data);
        localStorage.setItem('user_id', response.data.id);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    
    if (!localStorage.getItem('user_id')) {
      fetchCurrentUser();
    }
  }, []);
  
  // Add this function to the component
  const testApiConnection = async () => {
    try {
      console.log('Testing API connection...');
      const response = await api.get('/leads/');
      console.log('API connection test successful:', response.data);
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  };
  
  // Call this in useEffect
  useEffect(() => {
    testApiConnection();
  }, []);
  
  // Add this function to the component
  const checkFormValues = () => {
    const values = form.getFieldsValue(true);
    console.log('Current form values:', values);
    console.log('Name field value:', form.getFieldValue('name'));
    console.log('Phone field value:', form.getFieldValue('phone'));
    console.log('Form state values:', formValues);
  };
  
  // Add this useEffect to fetch notes when the Notes tab is activated
  useEffect(() => {
    if (activeTab === 'notes' && isEditMode && initialData?.id) {
      fetchLeadNotes(initialData.id);
    }
  }, [activeTab, isEditMode, initialData?.id]);
  
  // Add this function to handle multiple document uploads
  const handleUploadMultipleDocuments = async (values) => {
    try {
      setSubmittingDocuments(true);
      
      // Get tenant ID from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = user.tenant_id;
      
      if (!tenantId) {
        console.error('Tenant ID not found in localStorage');
        message.error('Tenant information not available. Please log in again.');
        setSubmittingDocuments(false);
        return;
      }
      
      // Process each document in the documents array
      const uploadPromises = values.documents.map(async (doc) => {
        // Skip if no file is selected or no name is provided
        if (!doc.document_path || !doc.document_path[0] || !doc.document_name) {
          return null;
        }
        
        const formData = new FormData();
        formData.append('document_name', doc.document_name);
        formData.append('lead', initialData.id);
        formData.append('tenant', tenantId);
        formData.append('document_path', doc.document_path[0].originFileObj);
        
        // Use the correct endpoint from urls.py
        return api.post(`/leads/${initialData.id}/upload-document/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      });
      
      // Filter out null promises (skipped uploads)
      const validPromises = uploadPromises.filter(p => p !== null);
      
      if (validPromises.length === 0) {
        message.warning('No valid documents to upload');
        setSubmittingDocuments(false);
        return;
      }
      
      // Wait for all uploads to complete
      await Promise.all(validPromises);
      
      // Reset form
      form.resetFields(['documents']);
      
      // Refresh documents list
      fetchLeadDocuments(initialData.id);
      
      message.success('Documents uploaded successfully');
    } catch (error) {
      console.error('Error uploading documents:', error);
      message.error('Failed to upload documents');
    } finally {
      setSubmittingDocuments(false);
    }
  };
  
  // Add this to your useEffect that runs on component mount
  useEffect(() => {
    // Check if there's a tab parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam) {
      setActiveTab(tabParam);
    }
    
    // ... rest of your existing useEffect code
  }, []);
  
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: initialData.name || '',
            email: initialData.email || '',
            phone: initialData.phone || '',
            whatsapp: initialData.whatsapp || '',
            lead_type: leadType,
            source: 'website_form',
            status: 'new',
            lead_activity_status: 'active',
            ...initialData
          }}
          onValuesChange={(changedValues, allValues) => {
            console.log('Form values changed:', changedValues);
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
          </Tabs>
          
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <FormSection title="Lead Information">
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Form.Item
                    label="Full Name"
                    name="name"
                    rules={[{ required: true, message: 'Please enter lead name' }]}
                  >
                    <Input 
                      placeholder="Enter lead's full name"
                      value={formValues.name}
                      onChange={(e) => {
                        const value = e.target.value;
                        form.setFieldsValue({ name: value });
                        setFormValues(prev => ({ ...prev, name: value }));
                        console.log('Name changed to:', value);
                        console.log('Form field value after change:', form.getFieldValue('name'));
                      }}
                    />
                  </Form.Item>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Form.Item
                    label="Email"
                    name="email"
                  >
                    <Input 
                      placeholder="Enter email address"
                      value={formValues.email}
                      onChange={(e) => {
                        const value = e.target.value;
                        form.setFieldsValue({ email: value });
                        setFormValues(prev => ({ ...prev, email: value }));
                        console.log('Email changed to:', value);
                        console.log('Form field value after change:', form.getFieldValue('email'));
                      }}
                    />
                  </Form.Item>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Form.Item
                    label="Phone"
                    name="phone"
                    rules={[{ required: true, message: 'Please enter phone number' }]}
                  >
                    <Input 
                      placeholder="Enter phone number"
                      value={formValues.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        form.setFieldsValue({ phone: value });
                        setFormValues(prev => ({ ...prev, phone: value }));
                        console.log('Phone changed to:', value);
                        console.log('Form field value after change:', form.getFieldValue('phone'));
                      }}
                    />
                  </Form.Item>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Form.Item
                    label="WhatsApp"
                    name="whatsapp"
                  >
                    <Input 
                      placeholder="Enter WhatsApp number (if different)"
                      value={formValues.whatsapp}
                      onChange={(e) => {
                        const value = e.target.value;
                        form.setFieldsValue({ whatsapp: value });
                        setFormValues(prev => ({ ...prev, whatsapp: value }));
                        console.log('WhatsApp changed to:', value);
                        console.log('Form field value after change:', form.getFieldValue('whatsapp'));
                      }}
                    />
                  </Form.Item>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Form.Item
                    label="Lead Type"
                    name="lead_type"
                    rules={[{ required: true, message: 'Please select lead type' }]}
                  >
                    <Select
                      placeholder="Select lead type"
                      options={leadTypeOptions}
                      value={formValues.lead_type}
                      onChange={(value) => {
                        handleInputChange('lead_type', value);
                        handleLeadTypeChange(value);
                      }}
                    />
                  </Form.Item>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Form.Item
                    label="Lead Source"
                    name="source"
                    rules={[{ required: true, message: 'Please select lead source' }]}
                  >
                    <Select
                      placeholder="Select lead source"
                      options={sourceOptions}
                      value={formValues.source}
                      onChange={(value) => handleInputChange('source', value)}
                    />
                  </Form.Item>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Form.Item
                    label="Status"
                    name="status"
                    rules={[{ required: true, message: 'Please select status' }]}
                  >
                    <Select
                      placeholder="Select status"
                      options={statusOptions}
                      value={formValues.status}
                      onChange={(value) => handleInputChange('status', value)}
                    />
                  </Form.Item>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Form.Item
                    label="Activity Status"
                    name="lead_activity_status"
                    rules={[{ required: true, message: 'Please select activity status' }]}
                  >
                    <Select
                      placeholder="Select activity status"
                      options={activityStatusOptions}
                      value={formValues.lead_activity_status}
                      onChange={(value) => handleInputChange('lead_activity_status', value)}
                    />
                  </Form.Item>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Form.Item
                    label="Last Contacted"
                    name="last_contacted"
                  >
                    <DatePicker 
                      style={{ width: '100%' }}
                      onChange={(date) => {
                        // Handle the date value properly
                        form.setFieldValue('last_contacted', date);
                        setFormValues(prev => ({
                          ...prev,
                          last_contacted: date
                        }));
                        console.log('Last contacted changed to:', date);
                      }}
                    />
                  </Form.Item>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Form.Item
                    label="Next Follow-up"
                    name="next_follow_up"
                  >
                    <DatePicker 
                      style={{ width: '100%' }}
                      onChange={(date) => {
                        // Handle the date value properly
                        form.setFieldValue('next_follow_up', date);
                        setFormValues(prev => ({
                          ...prev,
                          next_follow_up: date
                        }));
                        console.log('Next follow-up changed to:', date);
                      }}
                    />
                  </Form.Item>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Form.Item
                    label="Assigned To"
                    name="assigned_to"
                  >
                    <Select
                      placeholder="Select user to assign"
                      options={userOptions}
                      value={formValues.assigned_to}
                      onChange={(value) => handleInputChange('assigned_to', value)}
                    />
                  </Form.Item>
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
                          value={formValues.adults}
                          onChange={(value) => handleInputChange('adults', value)}
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
                          value={formValues.children}
                          onChange={(value) => handleInputChange('children', value)}
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
                          value={formValues.infants}
                          onChange={(value) => handleInputChange('infants', value)}
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
                    {/* Professional looking text area without middle line */}
                    <Box sx={{ mb: 3 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        placeholder="Add a new note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        sx={{ 
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            '& fieldset': {
                              borderColor: '#e0e0e0',
                            },
                            '&:hover fieldset': {
                              borderColor: '#9d277c',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#9d277c',
                            },
                          }
                        }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={handleAddNote}
                          disabled={!newNote.trim()}
                          sx={{ 
                            bgcolor: '#9d277c',
                            '&:hover': {
                              bgcolor: '#7c1e62',
                            }
                          }}
                        >
                          Add Note
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    {loadingNotes ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : notes.length > 0 ? (
                      <List>
                        {notes.map((note) => (
                          <Paper 
                            key={note.id} 
                            sx={{ 
                              mb: 2, 
                              p: 2,
                              borderRadius: '8px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}
                          >
                            {/* Message content first */}
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                mb: 2,
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              {note.note}
                            </Typography>
                            
                            {/* User info and date in the specified format */}
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              borderTop: '1px solid #f0f0f0',
                              pt: 1
                            }}>
                              <Typography variant="caption" color="text.secondary">
                                {note.added_by_details?.first_name} {note.added_by_details?.last_name} | {note.added_by_details?.role || 'Admin'}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                  {new Date(note.timestamp).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })} - {new Date(note.timestamp).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true
                                  })}
                                </Typography>
                                
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteNote(note.id)}
                                  aria-label="delete note"
                                  sx={{ ml: 1 }}
                                >
                                  <DeleteOutlined style={{ fontSize: '16px' }} />
                                </IconButton>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </List>
                    ) : (
                      <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                        No notes yet. Add your first note above.
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  Save the lead first to add notes.
                </Typography>
              )}
            </FormSection>
          )}
          
          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <FormSection title="Lead Documents">
              {isEditMode ? (
                <LeadDocuments 
                  leadId={initialData.id} 
                  documents={documents}
                  onDocumentUpload={fetchLeadDocuments}
                />
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
                <LeadActivities 
                  leadId={initialData.id} 
                  activities={activities}
                />
              ) : (
                <Typography color="text.secondary">
                  Save the lead first to add activities.
                </Typography>
              )}
            </FormSection>
          )}
          
          <Box sx={{ mb: 2, textAlign: 'right' }}>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={checkFormValues}
              sx={{ mr: 2 }}
            >
              Check Form Values
            </Button>
          </Box>
          
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