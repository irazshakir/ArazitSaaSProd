import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Grid, Paper, Typography, Divider as MuiDivider, Tab, Tabs, Button, 
  List, ListItem, ListItemText, ListItemIcon, Chip, TextField, IconButton, 
  Card, CardContent, CircularProgress 
} from '@mui/material';
import { 
  Form, message, InputNumber, Row, Col, 
  Upload, Select, DatePicker, Checkbox, Table, Tag, Space, Modal, Input, Switch, Divider
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
import FormNumberInput from '../forms/common/formNumberInput';
import LeadDocuments from './components/leadDocuments';
import LeadActivities from './components/leadActivities';
import FlightForm from './components/FlightForm';
import StudyForm from './components/StudyForm';

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
  const [branchOptions, setBranchOptions] = useState([]);
  
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
    branch: initialData.branch || null,
    study: initialData.study || {}
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
  
  // Function to get lead type options based on industry
  const getIndustryLeadTypes = () => {
    try {
      // Try multiple possible localStorage keys for industry
      const directIndustry = localStorage.getItem('industry') || 
                           localStorage.getItem('user_industry') || 
                           '';
      
      // Get the full user object to see what's actually stored
      const userStr = localStorage.getItem('user');
      let userObj = null;
      
      try {
        if (userStr) {
          userObj = JSON.parse(userStr);
        }
      } catch (err) {
        // Silently handle error
      }
      
      // Check if industry is available in the user object - this appears to be the key we need based on the screenshot
      const userIndustry = userObj?.industry || '';
      // Also check for userData.industry which is seen in the screenshot
      const userData = userObj?.userData || {};
      const userDataIndustry = (userData && userData.industry) ? userData.industry : '';
      
      // Use the first available industry value
      const effectiveIndustry = userDataIndustry || userIndustry || directIndustry || '';
      
      // Default lead types for any industry
      const commonLeadTypes = [
        { value: 'flight', label: 'Flight' },
        { value: 'visa', label: 'Visa' },
        { value: 'transfer', label: 'Transfer' }
      ];
      
      // Industry-specific lead types
      let leadTypes = [];
      
      // Convert to lowercase and remove quotes for comparison
      const normalizedIndustry = effectiveIndustry ? effectiveIndustry.toLowerCase().replace(/"/g, '') : '';
      
      switch(normalizedIndustry) {
        case 'hajj_umrah':
          leadTypes = [
            { value: 'hajj_package', label: 'Hajj Package' },
            { value: 'custom_umrah', label: 'Custom Umrah' },
            { value: 'readymade_umrah', label: 'Readymade Umrah' },
            { value: 'ziyarat', label: 'Ziyarat' },
            ...commonLeadTypes
          ];
          break;
        case 'immigration':
          leadTypes = [
            { value: 'visit_visa', label: 'Visit Visa' },
            { value: 'skilled_immigration', label: 'Skilled Immigration' },
            { value: 'job_visa', label: 'Job Visa' },
            { value: 'trc', label: 'TRC' },
            { value: 'business_immigration', label: 'Business Immigration' },
            { value: 'study_visa', label: 'Study Visa' }
          ];
          break;
        case 'travel_tourism':
          leadTypes = [
            { value: 'travel_package', label: 'Travel Package' },
            ...commonLeadTypes
          ];
          break;
        default:
          // Default to hajj_umrah if no industry is specified
          leadTypes = [
            { value: 'hajj_package', label: 'Hajj Package' },
            { value: 'custom_umrah', label: 'Custom Umrah' },
            { value: 'readymade_umrah', label: 'Readymade Umrah' },
            { value: 'ziyarat', label: 'Ziyarat' },
            ...commonLeadTypes
          ];
      }
      
      return leadTypes;
    } catch (error) {
      // Return default lead types as fallback
      return [
        { value: 'hajj_package', label: 'Hajj Package' },
        { value: 'custom_umrah', label: 'Custom Umrah' },
        { value: 'readymade_umrah', label: 'Readymade Umrah' },
        { value: 'flight', label: 'Flight' },
        { value: 'visa', label: 'Visa' },
        { value: 'transfer', label: 'Transfer' },
        { value: 'ziyarat', label: 'Ziyarat' }
      ];
    }
  };
  
  // Lead type options (will be set based on industry)
  const [leadTypeOptions, setLeadTypeOptions] = useState([]);
  
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
        query_notes: queryFor.notes || '',
        // Set branch value
        branch: initialData.branch || null
      };
      
      form.setFieldsValue(updatedValues);
      setFormValues(updatedValues);
      
      // Set lead type
      if (initialData.lead_type) {
        setLeadType(initialData.lead_type);
      }
    }
  }, [initialData, form]);
  
  // Initialize lead type options based on user's industry
  useEffect(() => {
    try {
      // Get industry-specific lead types
      const industryLeadTypes = getIndustryLeadTypes();
      setLeadTypeOptions(industryLeadTypes);
      
      // Set default lead type if none is provided
      if ((!initialData.lead_type || initialData.lead_type === '') && industryLeadTypes.length > 0) {
        const defaultLeadType = industryLeadTypes[0].value;
        setLeadType(defaultLeadType);
        form.setFieldValue('lead_type', defaultLeadType);
        
        // Update formValues
        setFormValues(prev => ({
          ...prev,
          lead_type: defaultLeadType
        }));
      } else if (initialData.lead_type) {
        // Check if the provided lead_type is compatible with the industry
        const isValidType = industryLeadTypes.some(option => option.value === initialData.lead_type);
        
        if (!isValidType) {
          // Use the first valid lead type instead
          if (industryLeadTypes.length > 0) {
            const defaultType = industryLeadTypes[0].value;
            setLeadType(defaultType);
            form.setFieldValue('lead_type', defaultType);
            
            // Update formValues
            setFormValues(prev => ({
              ...prev,
              lead_type: defaultType
            }));
          }
        } else {
          // Valid type, make sure it's set everywhere
          setLeadType(initialData.lead_type);
          form.setFieldValue('lead_type', initialData.lead_type);
        }
      }
    } catch (error) {
      // Set default options as fallback
      const defaultOptions = [
        { value: 'hajj_package', label: 'Hajj Package' },
        { value: 'custom_umrah', label: 'Custom Umrah' },
        { value: 'readymade_umrah', label: 'Readymade Umrah' },
        { value: 'flight', label: 'Flight' },
        { value: 'visa', label: 'Visa' },
        { value: 'transfer', label: 'Transfer' },
        { value: 'ziyarat', label: 'Ziyarat' }
      ];
      
      setLeadTypeOptions(defaultOptions);
      
      // Set a safe default lead type
      const safeDefaultType = 'hajj_package';
      setLeadType(safeDefaultType);
      form.setFieldValue('lead_type', safeDefaultType);
    }
  }, []);
  
  // Fetch product options based on lead type
  useEffect(() => {
    if (leadType) {
      fetchProductOptions();
    }
  }, [leadType]);
  
  // Function to fetch product options based on lead type
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
          endpoint = 'umrah-packages/';
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
        case 'visit_visa':
          endpoint = 'visit-visas/';
          break;
        case 'skilled_immigration':
          endpoint = 'skilled-immigration/';
          break;
        case 'job_visa':
          endpoint = 'job-visas/';
          break;
        case 'trc':
          endpoint = 'trc/';
          break;
        case 'business_immigration':
          endpoint = 'business-immigration/';
          break;
        case 'travel_package':
          endpoint = 'travel-packages/';
          break;
        case 'study_visa':
          endpoint = 'study/';
          break;
        default:
          setProductOptions([]);
          return;
      }
      
      console.log('Fetching from endpoint:', endpoint); // Debug log
      const response = await api.get(endpoint);
      console.log('API Response:', response.data); // Debug log
      
      // Check if response.data is an array
      const dataArray = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results && Array.isArray(response.data.results))
          ? response.data.results
          : [];
        
      console.log('Data array:', dataArray); // Debug log
      
      const options = dataArray.map(item => ({
        value: item.id,
        label: item.package_name || `Package ${item.id}`
      }));
      
      console.log('Mapped options:', options); // Debug log
      setProductOptions(options);
    } catch (error) {
      console.error('Error fetching product options:', error);
      message.error('Failed to load package options');
      setProductOptions([]);
    }
  };
  
  // Fetch users for assigned_to dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get tenant_id from localStorage
        const tenantId = localStorage.getItem('tenant_id');
        
        if (!tenantId) {
          message.error('Tenant information not available');
          return;
        }
        
        try {
          // Try to fetch active users for this tenant with the correct path
          const response = await api.get(`/auth/active-by-tenant/?tenant=${tenantId}`);
          
          let usersArray = Array.isArray(response.data) 
            ? response.data
            : (response.data?.results && Array.isArray(response.data.results))
              ? response.data.results
              : [];
          
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
          // Try a direct fetch to debug the issue with the correct path
          try {
            const fullUrl = `${import.meta.env.VITE_API_BASE_URL}/api/auth/active-by-tenant/?tenant=${tenantId}`;
            
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
            // As a last resort, try to get all users with the correct path
            try {
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
              message.error('Failed to load users');
            }
          }
        }
      } catch (error) {
        message.error('Failed to load users');
      }
    };
    
    fetchUsers();
  }, []);
  
  // Fetch branches for branch dropdown
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        // Get tenant_id from localStorage
        const tenantId = localStorage.getItem('tenant_id');
        
        if (!tenantId) {
          return;
        }
        
        try {
          // Fetch branches for the current tenant
          const response = await api.get('/auth/branches/', {
            params: {
              tenant: tenantId
            }
          });
          
          // Process response data
          let branchesArray = Array.isArray(response.data) 
            ? response.data
            : (response.data?.results && Array.isArray(response.data.results))
              ? response.data.results
              : [];
          
          // Create branch options
          const options = branchesArray.map(branch => ({
            value: branch.id,
            label: branch.name
          }));
          
          setBranchOptions(options);
          
          // Set branch field value explicitly in edit mode
          if (isEditMode && initialData.branch) {
            // First set form's field value
            form.setFieldsValue({ branch: initialData.branch });
            
            // Then update the formValues state to match
            setFormValues(prev => ({
              ...prev,
              branch: initialData.branch
            }));
          }
        } catch (error) {
          // Try fallback method
          try {
            const response = await api.get('/auth/branches/');
            
            let allBranches = Array.isArray(response.data) 
              ? response.data
              : (response.data?.results && Array.isArray(response.data.results))
                ? response.data.results
                : [];
            
            // Filter branches by tenant_id manually
            const filteredBranches = allBranches.filter(branch => 
              branch.tenant === parseInt(tenantId) || 
              branch.tenant_id === parseInt(tenantId) ||
              branch.tenant === tenantId || 
              branch.tenant_id === tenantId
            );
            
            // Convert to options format
            const options = filteredBranches.map(branch => ({
              value: branch.id,
              label: branch.name
            }));
            
            setBranchOptions(options);
            
            // If we're in edit mode, set the branch value explicitly
            if (isEditMode && initialData.branch) {
              form.setFieldsValue({ branch: initialData.branch });
            }
          } catch (fallbackError) {
            message.error('Failed to load branches');
          }
        }
      } catch (error) {
        message.error('Failed to load branches');
      }
    };
    
    fetchBranches();
  }, [form, isEditMode, initialData.branch]);
  
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
        return;
      }
      
      // Use the lead ID to filter documents
      const response = await api.get(`/lead-documents/?lead=${leadId}`);
      
      // Process response data
      let documentsArray = Array.isArray(response.data) 
        ? response.data
        : (response.data?.results && Array.isArray(response.data.results))
          ? response.data.results
          : [];
      
      // Set the documents state
      setDocuments(documentsArray);
    } catch (error) {
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
      message.error('Failed to add activity');
      return false;
    }
  };
  
  // Handle lead type change
  const handleLeadTypeChange = (value) => {
    console.log('Lead type changed to:', value); // Debug log
    setLeadType(value);
    
    // Reset product selection
    form.setFieldValue('hajj_package', null);
    form.setFieldValue('custom_umrah', null);
    form.setFieldValue('readymade_umrah', null);
    form.setFieldValue('flight', null);
    form.setFieldValue('visa', null);
    form.setFieldValue('transfer', null);
    form.setFieldValue('ziyarat', null);
    form.setFieldValue('visit_visa', null);
    form.setFieldValue('skilled_immigration', null);
    form.setFieldValue('job_visa', null);
    form.setFieldValue('trc', null);
    form.setFieldValue('business_immigration', null);
    form.setFieldValue('travel_package', null);
    form.setFieldValue('study_visa', null);
    
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
      form.setFieldsValue({ [getProductFieldName()]: value });
      
      // Fetch the package details
      let endpoint = '';
      
      // Determine endpoint based on lead type
      switch(leadType) {
        // Hajj & Umrah lead types
        case 'hajj_package':
          endpoint = `hajj-packages/${value}/`;
          break;
        case 'custom_umrah':
          endpoint = `custom-umrah/${value}/`;
          break;
        case 'readymade_umrah':
          endpoint = `umrah-packages/${value}/`;
          break;
        case 'ziyarat':
          endpoint = `ziyarats/${value}/`;
          break;
          
        // Common lead types
        case 'flight':
          endpoint = `flights/${value}/`;
          break;
        case 'visa':
          endpoint = `visas/${value}/`;
          break;
        case 'transfer':
          endpoint = `transfers/${value}/`;
          break;
          
        // Immigration lead types
        case 'visit_visa':
          endpoint = `visit-visas/${value}/`;
          break;
        case 'skilled_immigration':
          endpoint = `skilled-immigration/${value}/`;
          break;
        case 'job_visa':
          endpoint = `job-visas/${value}/`;
          break;
        case 'trc':
          endpoint = `trc/${value}/`;
          break;
        case 'business_immigration':
          endpoint = `business-immigration/${value}/`;
          break;
        case 'study_visa':
          endpoint = `study/${value}/`;
          break;
          
        // Travel and Tourism lead types
        case 'travel_package':
          endpoint = `travel-packages/${value}/`;
          break;
          
        default:
          return;
      }
      
      const response = await api.get(endpoint);
      setSelectedPackageDetails(response.data);
    } catch (error) {
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
  
  // Add a ref for the StudyForm component
  const studyFormRef = useRef(null);
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate form fields
      await form.validateFields();
      setLoading(true);
      
      // If it's a study visa lead and we have a studyFormRef, save study data first
      if (formValues.lead_type === 'study_visa' && studyFormRef.current) {
        try {
          // Try to save study data first using the ref
          await studyFormRef.current.saveStudyData();
        } catch (error) {
          message.error("Failed to save study details. Please try again.");
          setLoading(false);
          return; // Stop the submission if study data fails to save
        }
      }
      
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
        branch: formValues.branch || null,
        tenant: localStorage.getItem('tenant_id'),
        created_by: localStorage.getItem('user_id'),
        // Add product-specific fields based on lead type
        hajj_package: formValues.lead_type === 'hajj_package' ? formValues.hajj_package : null,
        readymade_umrah: formValues.lead_type === 'readymade_umrah' ? formValues.readymade_umrah : null,
        custom_umrah: formValues.lead_type === 'custom_umrah' ? formValues.custom_umrah : null,
        flight: formValues.lead_type === 'flight' ? {
          travelling_from: formValues.travelling_from,
          travelling_to: formValues.travelling_to,
          travel_date: formValues.travel_date ? 
            (isDayjsObject(formValues.travel_date) ? 
              formValues.travel_date.format('YYYY-MM-DD') : 
              // Safely convert date strings
              (typeof formValues.travel_date === 'string' ? 
                formValues.travel_date : 
                null)) : 
            null,
          return_date: formValues.return_date ? 
            (isDayjsObject(formValues.return_date) ? 
              formValues.return_date.format('YYYY-MM-DD') : 
              // Safely convert date strings
              (typeof formValues.return_date === 'string' ? 
                formValues.return_date : 
                null)) : 
            null,
          pnr: formValues.pnr,
          ticket_status: formValues.ticket_status,
          carrier: formValues.carrier,
          passengers: formValues.passengers,
          passenger_details: formValues.passenger_details ? formValues.passenger_details.map(passenger => ({
            ...passenger,
            expiry_date: passenger.expiry_date ? 
              (isDayjsObject(passenger.expiry_date) ? 
                passenger.expiry_date.format('YYYY-MM-DD') : 
                // Safely convert date strings
                (typeof passenger.expiry_date === 'string' ? 
                  passenger.expiry_date : 
                  null)) : 
              null
          })) : [],
          cost_details: formValues.cost_details || {}
        } : null,
        visa: formValues.lead_type === 'visa' ? formValues.visa : null,
        transfer: formValues.lead_type === 'transfer' ? formValues.transfer : null,
        ziyarat: formValues.lead_type === 'ziyarat' ? formValues.ziyarat : null,
        study_visa: formValues.lead_type === 'study_visa' ? formValues.study : null,
        query_for: {
          adults: formValues.adults || 0,
          children: formValues.children || 0,
          infants: formValues.infants || 0,
          notes: formValues.query_notes || ''
        },
        tags: null,
        custom_fields: null
      };
      
      // Make API call based on edit mode
      if (isEditMode) {
        const response = await api.put(`/leads/${initialData.id}/`, leadData);
        message.success('Lead updated successfully');
      } else {
        const response = await api.post('/leads/', leadData);
        message.success('Lead created successfully');
      }
      
      if (onSuccess) onSuccess();
      else navigate('/dashboard/leads');
    } catch (error) {
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
    switch (leadType) {
      case 'hajj_package': return 'hajj_package';
      case 'custom_umrah': return 'custom_umrah';
      case 'readymade_umrah': return 'readymade_umrah';
      case 'flight': return 'flight_details';
      case 'visa': return 'visa';
      case 'transfer': return 'transfer';
      case 'ziyarat': return 'ziyarat';
      case 'visit_visa': return 'visit_visa';
      case 'skilled_immigration': return 'skilled_immigration';
      case 'job_visa': return 'job_visa';
      case 'trc': return 'trc';
      case 'business_immigration': return 'business_immigration';
      case 'travel_package': return 'travel_package';
      case 'study_visa': return 'study_visa';
      default: return 'hajj_package';
    }
  };
  
  // Get product field label based on lead type
  const getProductFieldLabel = () => {
    switch (leadType) {
      case 'hajj_package': return 'Select Hajj Package';
      case 'custom_umrah': return 'Select Custom Umrah';
      case 'readymade_umrah': return 'Select Readymade Umrah';
      case 'flight': return 'Select Flight';
      case 'visa': return 'Select Visa';
      case 'transfer': return 'Select Transfer';
      case 'ziyarat': return 'Select Ziyarat';
      case 'visit_visa': return 'Select Visit Visa';
      case 'skilled_immigration': return 'Select Skilled Immigration';
      case 'job_visa': return 'Select Job Visa';
      case 'trc': return 'Select TRC';
      case 'business_immigration': return 'Select Business Immigration';
      case 'travel_package': return 'Select Travel Package';
      case 'study_visa': return 'Select Study Program';
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
        // Silently handle error
      }
    };
    
    if (!localStorage.getItem('user_id')) {
      fetchCurrentUser();
    }
  }, []);
  
  // Test API connection function - removed console logs
  const testApiConnection = async () => {
    try {
      const response = await api.get('/leads/');
      return true;
    } catch (error) {
      return false;
    }
  };
  
  // Call this in useEffect
  useEffect(() => {
    testApiConnection();
  }, []);
  
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
  }, []);
  
  // Function to update branch when a user is assigned
  const handleUserAssignment = async (userId) => {
    try {
      // Only proceed if we have a valid user ID
      if (!userId) return;
      
      // Update the assigned_to field
      handleInputChange('assigned_to', userId);
      
      // Try to fetch user details to get their branch
      try {
        const response = await api.get(`auth/users/${userId}/`);
        const userData = response.data;
        
        // If user has a branch assigned, update the branch field
        if (userData.branch) {
          form.setFieldValue('branch', userData.branch);
          setFormValues(prev => ({
            ...prev,
            branch: userData.branch
          }));
        }
      } catch (error) {
        // Don't show an error message to the user as this is a background operation
      }
    } catch (error) {
      // Silently handle errors
    }
  };
  
  // Add this effect to fetch flight details when editing a flight lead
  useEffect(() => {
    const fetchFlightDetails = async () => {
      if (isEditMode && leadType === 'flight' && initialData.id) {
        try {
          // First, check if flight data is already in initialData
          if (initialData.flight) {
            // Process flight data
            const flightData = typeof initialData.flight === 'string' 
              ? JSON.parse(initialData.flight) 
              : initialData.flight;
              
            // Format cost details if available
            const costDetails = flightData.cost_details || {};
            // Format number fields properly
            if (costDetails) {
              ['adult_price', 'child_price', 'infant_price', 'total_cost', 'total_sell', 'total_profit'].forEach(field => {
                if (costDetails[field] !== undefined) {
                  costDetails[field] = Number(costDetails[field]);
                }
              });
            }
            
            // Update formValues with flight data
            const updatedValues = {
              ...formValues,
              travelling_from: flightData.travelling_from || '',
              travelling_to: flightData.travelling_to || '',
              travel_date: flightData.travel_date ? 
                (dayjs(flightData.travel_date).isValid() ? dayjs(flightData.travel_date) : null) : null,
              return_date: flightData.return_date ? 
                (dayjs(flightData.return_date).isValid() ? dayjs(flightData.return_date) : null) : null,
              pnr: flightData.pnr || '',
              ticket_status: flightData.ticket_status || 'inquiry',
              carrier: flightData.carrier || '',
              passengers: flightData.passengers || { adult: 0, child: 0, infant: 0 },
              passenger_details: flightData.passenger_details ? flightData.passenger_details.map(passenger => ({
                ...passenger,
                expiry_date: passenger.expiry_date ? 
                  (dayjs(passenger.expiry_date).isValid() ? dayjs(passenger.expiry_date) : null) : null
              })) : [],
              cost_details: costDetails
            };
            
            // Update state and form values
            setFormValues(updatedValues);
            // Set form fields
            form.setFieldsValue(updatedValues);
          } else {
            // Fetch flight data from the API
            try {
              const response = await api.get(`/flights/`, {
                params: { lead_inquiry: initialData.id }
              });
              
              if (response.data.results && response.data.results.length > 0) {
                const flightData = response.data.results[0];
                
                // Also fetch passenger details and cost details
                const passengersResponse = await api.get(`/passengers/`, {
                  params: { flight_inquiry: flightData.id }
                });
                const costResponse = await api.get(`/cost-details/`, {
                  params: { flight_inquiry: flightData.id }
                });
                
                const passengerDetails = passengersResponse.data.results || [];
                const costDetails = costResponse.data.results && costResponse.data.results.length > 0 
                  ? costResponse.data.results[0] 
                  : {};
                
                // Format number fields in cost details
                if (costDetails) {
                  ['adult_price', 'child_price', 'infant_price', 'total_cost', 'total_sell', 'total_profit'].forEach(field => {
                    if (costDetails[field] !== undefined) {
                      costDetails[field] = Number(costDetails[field]);
                    }
                  });
                }
                
                // Update formValues with all flight data
                const updatedValues = {
                  ...formValues,
                  travelling_from: flightData.travelling_from || '',
                  travelling_to: flightData.travelling_to || '',
                  travel_date: flightData.travel_date ? 
                    (dayjs(flightData.travel_date).isValid() ? dayjs(flightData.travel_date) : null) : null,
                  return_date: flightData.return_date ? 
                    (dayjs(flightData.return_date).isValid() ? dayjs(flightData.return_date) : null) : null,
                  pnr: flightData.pnr || '',
                  ticket_status: flightData.ticket_status || 'inquiry',
                  carrier: flightData.carrier || '',
                  passengers: flightData.passengers || { adult: 0, child: 0, infant: 0 },
                  passenger_details: passengerDetails ? passengerDetails.map(passenger => ({
                    ...passenger,
                    expiry_date: passenger.expiry_date ? 
                      (dayjs(passenger.expiry_date).isValid() ? dayjs(passenger.expiry_date) : null) : null
                  })) : [],
                  cost_details: costDetails
                };
                
                // Update state and form values
                setFormValues(updatedValues);
                // Set form fields
                form.setFieldsValue(updatedValues);
              }
            } catch (apiError) {
              // Silently handle error
            }
          }
        } catch (error) {
          message.error('Failed to load flight details');
        }
      }
    };
    
    fetchFlightDetails();
  }, [isEditMode, leadType, initialData.id]);
  
  // Set initial values explicitly for edit mode
  useEffect(() => {
    if (isEditMode) {
      // Set basic fields
      form.setFieldsValue({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone,
        whatsapp: initialData.whatsapp,
        lead_type: initialData.lead_type,
        source: initialData.source,
        status: initialData.status,
        lead_activity_status: initialData.lead_activity_status,
        last_contacted: initialData.last_contacted,
        next_follow_up: initialData.next_follow_up,
        assigned_to: initialData.assigned_to,
        branch: initialData.branch
      });
      
      // Set study visa fields if present
      if (initialData.lead_type === 'study_visa') {
        form.setFieldsValue({
          inquiry_details: initialData.inquiry_details || {},
          eligibility_details: initialData.eligibility_details || {},
          cost_details: initialData.cost_details || {}
        });
      }
    }
  }, [form, initialData, isEditMode]);
  
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
            branch: initialData.branch || null,
            ...initialData
          }}
          onValuesChange={(changedValues, allValues) => {
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
                      onChange={(value) => handleUserAssignment(value)}
                    />
                  </Form.Item>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Form.Item
                    label="Branch"
                    name="branch"
                  >
                    <Select
                      placeholder="Select branch"
                      options={branchOptions}
                      defaultValue={initialData.branch}
                      value={formValues.branch || initialData.branch}
                      onChange={(value) => {
                        handleInputChange('branch', value);
                      }}
                    />
                  </Form.Item>
                </Grid>
              </Grid>
            </FormSection>
          )}
          
          {/* Product Details Tab */}
          {activeTab === 'product' && (
            <>
              {leadType === 'flight' ? (
                <React.Fragment>
                <FormSection title="Flight Details">
                  <FlightForm
                    isEditMode={isEditMode}
                    initialData={{
                      lead_id: initialData.id || null,
                      airline: formValues.airline || '',
                      departure_date: formValues.departure_date || null,
                      return_date: formValues.return_date || null,
                      from_city: formValues.from_city || '',
                      to_city: formValues.to_city || '',
                      flight_class: formValues.flight_class || ''
                    }}
                    onSuccess={(data) => {
                      message.success('Flight details saved successfully!');
                      if (data && data.id) {
                        handleInputChange('flight_details', data.id);
                      }
                    }}
                    handleInputChange={handleInputChange} 
                    form={form}
                    formValues={formValues}
                  />
                </FormSection>
                </React.Fragment>
              ) : leadType === 'study_visa' ? (
                <React.Fragment>
                <FormSection title="Study Visa Details">
                  <StudyForm
                    form={form}
                    formValues={formValues}
                    handleInputChange={handleInputChange}
                    initialData={{
                      lead_id: initialData.id || null
                    }}
                    onSave={(studyData) => {
                      // Update formValues with the saved study data
                      setFormValues(prev => ({
                        ...prev,
                        study: studyData
                      }));
                    }}
                    ref={studyFormRef}
                  />
                </FormSection>
                </React.Fragment>
              ) : (
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
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </FormSection>
              )}
            </>
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