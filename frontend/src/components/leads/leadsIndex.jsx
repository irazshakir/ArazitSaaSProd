import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Typography, Stack, Grid, Paper, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import api from '../../services/api';
import { message } from 'antd';
import dataAccessService from '../../services/dataAccessService';
import { BellOutlined } from '@ant-design/icons';
// import useWebSocket from '../../hooks/useWebSocket';
import { usePullToRefresh, useIsMobile } from '../../utils/responsiveUtils';

// Import universal components
import SearchBar from '../universalComponents/searchBar';
import DownloadButton from '../universalComponents/downloadButton';
import FilterButton from '../universalComponents/filterButton';
import CreateButton from '../universalComponents/createButton';
import TableList from '../universalComponents/tableList';
import TableSkeleton from '../universalComponents/tableSkeleton';
import BulkUploadButton from '../universalComponents/bulkUploadButton';

// Import auth utilities
import { getUser, getUserRole } from '../../utils/auth';

const LeadsIndex = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [columns, setColumns] = useState([]);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [leadTypeOptions, setLeadTypeOptions] = useState([]);
  
  // WebSocket connection for real-time updates
  // const { lastMessage, sendMessage } = useWebSocket('leads');

  // Initialize theme and mobile detection
  useEffect(() => {
    if (theme) {
      setIsThemeReady(true);
    }
  }, [theme]);

  // Initialize mobile detection after theme is ready
  useEffect(() => {
    if (isThemeReady) {
      const mediaQuery = window.matchMedia(theme.breakpoints.down('sm'));
      setIsMobileView(mediaQuery.matches);

      const handleResize = (e) => setIsMobileView(e.matches);
      mediaQuery.addListener(handleResize);
      return () => mediaQuery.removeListener(handleResize);
    }
  }, [isThemeReady, theme]);

  // Initialize pull-to-refresh after mobile detection
  const { refreshing } = usePullToRefresh(isMobileView ? refreshLeads : null);
  

  // Get current user and role from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = getUserRole();
      const tenantId = localStorage.getItem('tenant_id');
      
      // IMPORTANT FIX: Get department_id from user object directly, not localStorage
      const departmentId = userData.department_id || localStorage.getItem('department_id');
      
      setUser(userData);
      setUserRole(userRole);
      setTenantId(tenantId);
      setDepartmentId(departmentId);
    } catch (error) {
      message.error('Error loading user data. Please log in again.');
      navigate('/login');
    }
  }, [navigate]);

  // Add this effect to refresh when navigating to the page
  useEffect(() => {
    if (user && userRole && tenantId) {
      refreshLeads();
    }
  }, [location.pathname]);

  // Handle real-time lead updates
  const handleLeadUpdate = useCallback((updatedLead) => {
    setLeads(prevLeads => {
      // Check if the lead already exists
      const existingLeadIndex = prevLeads.findIndex(lead => lead.id === updatedLead.id);
      
      if (existingLeadIndex !== -1) {
        // Update existing lead
        const newLeads = [...prevLeads];
        newLeads[existingLeadIndex] = {
          ...newLeads[existingLeadIndex],
          ...updatedLead
        };
        return newLeads;
      } else {
        // Add new lead at the beginning of the list
        return [updatedLead, ...prevLeads];
      }
    });
  }, []);

  // Listen for WebSocket messages
  // useEffect(() => {
  //   if (lastMessage) {
  //     console.log('WebSocket message received:', lastMessage);
  //   }
  //   if (lastMessage?.type === 'lead_update') {
  //     console.log('lead_update received:', lastMessage.data);
  //     handleLeadUpdate(lastMessage.data);
  //   }
  // }, [lastMessage, handleLeadUpdate]);

  // Debug: log leads state whenever it changes
  // useEffect(() => {
  //   console.log('Leads state updated:', leads);
  //   applyFiltersAndSearch(searchQuery, activeFilters);
  // }, [leads]);

  // Listen for WebSocket messages
  // useEffect(() => {
  //   if (lastMessage?.type === 'lead_update') {
  //     handleLeadUpdate(lastMessage.data);
  //   }
  // }, [lastMessage, handleLeadUpdate]);

  // Update filtered leads whenever leads change
  useEffect(() => {
    applyFiltersAndSearch(searchQuery, activeFilters);
  }, [leads]);

  // Initialize columns after theme is available
  useEffect(() => {
    const baseColumns = [
      { 
        field: 'name', 
        headerName: 'NAME', 
        width: { xs: '85%', sm: '20%' },
        minWidth: 150,
        sortable: true,
        showInMobile: true,
        render: (value, row) => {
          let isPastDue = false;
          if (row.next_follow_up) {
            const followUpDate = new Date(row.next_follow_up);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            followUpDate.setHours(0, 0, 0, 0);
            isPastDue = followUpDate < today && !['won', 'lost'].includes(row.status);
          }
          
          return (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1 }}>{value}</Typography>
              {isPastDue && (
                <Chip 
                  label="Past Due" 
                  size="small"
                  sx={{ 
                    borderRadius: '4px',
                    backgroundColor: 'rgba(231, 76, 60, 0.2)',
                    color: 'rgb(231, 76, 60)',
                    fontSize: '0.625rem',
                    height: '20px',
                    fontWeight: 500
                  }}
                />
              )}
            </Box>
          );
        }
      },
      { 
        field: 'phone', 
        headerName: 'PHONE', 
        width: { xs: '60%', sm: '15%' }, 
        minWidth: 120,
        sortable: true,
        showInMobile: false,
        render: (value) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <a href={`tel:${value}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              {value}
            </a>
          </Box>
        )
      },
      { 
        field: 'assigned_to_name', 
        headerName: 'ASSIGNED TO', 
        width: { xs: '60%', sm: '15%' },
        minWidth: 120,
        sortable: true,
        showInMobile: false,
        render: (value) => value || 'Unassigned'
      },
      { 
        field: 'lead_type_display', 
        headerName: 'TYPE', 
        width: { xs: '40%', sm: '15%' },
        minWidth: 120,
        sortable: true,
        showInMobile: false
      },
      { 
        field: 'status_display', 
        headerName: 'STATUS', 
        width: { xs: '40%', sm: '15%' },
        minWidth: 100,
        sortable: true,
        showInMobile: false,
        type: 'status',
        render: (value, row) => (
          <Chip 
            label={value}
            size="small"
            sx={{ 
              borderRadius: '4px',
              backgroundColor: getStatusColor(row.status).bg,
              color: getStatusColor(row.status).text,
              fontWeight: 500
            }} 
          />
        )
      },
      { 
        field: 'next_follow_up', 
        headerName: 'FOLLOW UP', 
        width: { xs: '60%', sm: '15%' },
        minWidth: 120,
        sortable: false,
        showInMobile: false,
        render: (value) => {
          if (!value) return 'Not scheduled';
          
          const followUpDate = new Date(value);
          const today = new Date();
          
          // Remove time component from dates for accurate comparison
          today.setHours(0, 0, 0, 0);
          followUpDate.setHours(0, 0, 0, 0);
          
          const isPastDue = followUpDate < today;
          
          return (
            <Typography 
              variant="body2" 
              sx={{ 
                color: isPastDue ? 'rgb(231, 76, 60)' : 'inherit',
                fontWeight: isPastDue ? 500 : 400 
              }}
            >
              {followUpDate.toLocaleDateString()}
            </Typography>
          );
        }
      },
      { 
        field: 'lead_activity_status', 
        headerName: 'ACTIVITY', 
        width: { xs: '40%', sm: '15%' },
        minWidth: 100,
        sortable: false,
        showInMobile: false,
        render: (value) => (
          <Chip 
            label={value === 'active' ? 'Active' : 'Inactive'}
            size="small"
            sx={{ 
              borderRadius: '4px',
              backgroundColor: value === 'active' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
              color: value === 'active' ? 'rgb(46, 204, 113)' : 'rgb(231, 76, 60)',
              fontWeight: 500
            }} 
          />
        )
      },
      { 
        field: 'department_name', 
        headerName: 'DEPARTMENT', 
        width: { xs: '60%', sm: '15%' },
        minWidth: 120,
        sortable: true,
        showInMobile: false,
        render: (value) => value || 'Unassigned'
      }
    ];

    setColumns(baseColumns);
  }, [theme]);

  // Get color based on status
  const getStatusColor = (status) => {
    switch(status) {
      case 'new':
        return { bg: 'rgba(33, 150, 243, 0.2)', text: 'rgb(33, 150, 243)' };
      case 'qualified':
        return { bg: 'rgba(76, 175, 80, 0.2)', text: 'rgb(76, 175, 80)' };
      case 'non_potential':
        return { bg: 'rgba(158, 158, 158, 0.2)', text: 'rgb(158, 158, 158)' };
      case 'proposal':
        return { bg: 'rgba(255, 152, 0, 0.2)', text: 'rgb(255, 152, 0)' };
      case 'negotiation':
        return { bg: 'rgba(156, 39, 176, 0.2)', text: 'rgb(156, 39, 176)' };
      case 'won':
        return { bg: 'rgba(46, 204, 113, 0.2)', text: 'rgb(46, 204, 113)' };
      case 'lost':
        return { bg: 'rgba(231, 76, 60, 0.2)', text: 'rgb(231, 76, 60)' };
      default:
        return { bg: 'rgba(189, 189, 189, 0.2)', text: 'rgb(189, 189, 189)' };
    }
  };

  // Function to determine if a row should be highlighted for past follow-ups
  const getRowHighlight = (row) => {
    if (row.next_follow_up) {
      const followUpDate = new Date(row.next_follow_up);
      const today = new Date();
      
      // Remove time component from dates for accurate comparison
      today.setHours(0, 0, 0, 0);
      followUpDate.setHours(0, 0, 0, 0);
      
      // If follow-up date is in the past and the lead is not in won or lost status
      if (followUpDate < today && !['won', 'lost'].includes(row.status)) {
        return {
          backgroundColor: 'rgba(231, 76, 60, 0.08)',
          '&:hover': {
            backgroundColor: 'rgba(231, 76, 60, 0.12)',
          },
          // Using a light left border instead of absolute positioning to avoid layout issues
          borderLeft: '4px solid rgb(231, 76, 60)'
        };
      }
    }
    return {};
  };

  // Function to get lead type options based on industry
  const getIndustryLeadTypes = async () => {
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
      
      // Check if industry is available in the user object
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
      
      // Convert to lowercase and remove quotes for comparison
      const normalizedIndustry = effectiveIndustry ? effectiveIndustry.toLowerCase().replace(/"/g, '') : '';

      // If industry is general, fetch lead types from generalProduct API
      if (normalizedIndustry === 'general') {
        try {
          const tenantId = localStorage.getItem('tenant_id');
          if (!tenantId) {
            throw new Error('Tenant ID not found');
          }

          // Fetch products from generalProduct API
          const response = await api.get(`/general-product/products/?tenant=${tenantId}`);
          
          // Map the products to lead type options format
          const generalProducts = Array.isArray(response.data) 
            ? response.data 
            : (response.data?.results && Array.isArray(response.data.results))
              ? response.data.results 
              : [];

          const leadTypes = generalProducts.map(product => ({
            value: product.productName.toLowerCase().replace(/\s+/g, '_'),
            label: product.productName
          }));

          return [...leadTypes, ...commonLeadTypes];
        } catch (error) {
          console.error('Error fetching general products:', error);
          return commonLeadTypes;
        }
      }
      
      // Industry-specific lead types for other industries
      let leadTypes = [];
      
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
        case 'real_estate':
          leadTypes = [
            { value: 'development_project', label: 'Development Project' }
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

  // Initialize lead type options based on user's industry
  useEffect(() => {
    const initializeLeadTypes = async () => {
      try {
        // Get industry-specific lead types
        const industryLeadTypes = await getIndustryLeadTypes();
        setLeadTypeOptions(industryLeadTypes);
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
      }
    };

    initializeLeadTypes();
  }, []);

  // Filter options - updated to use dynamic lead types
  const filterOptions = [
    {
      name: 'status',
      label: 'Status',
      options: [
        { value: 'new', label: 'New' },
        { value: 'qualified', label: 'Qualified' },
        { value: 'non_potential', label: 'Non-Potential' },
        { value: 'proposal', label: 'Proposal' },
        { value: 'negotiation', label: 'Negotiation' },
        { value: 'won', label: 'Won' },
        { value: 'lost', label: 'Lost' }
      ]
    },
    {
      name: 'lead_type',
      label: 'Lead Type',
      options: leadTypeOptions
    },
    {
      name: 'follow_up_status',
      label: 'Follow Up Status',
      options: [
        { value: 'today', label: 'Today' },
        { value: 'this_week', label: 'This Week' },
        { value: 'this_month', label: 'This Month' },
        { value: 'past_due', label: 'Past Due' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'not_scheduled', label: 'Not Scheduled' }
      ]
    },
    {
      name: 'lead_activity_status',
      label: 'Activity Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    {
      name: 'no_activity_period',
      label: 'No Activity',
      options: [
        { value: '30', label: 'Past 30 Days' },
        { value: '60', label: 'Past 60 Days' },
        { value: '90', label: 'Past 90 Days' }
      ]
    }
  ];

  // Fetch data from API with no activity filter
  useEffect(() => {
    if (user && userRole && tenantId) {
      const fetchLeads = async () => {
        try {
          setLoading(true);
          
          const apiParams = {
            tenant: tenantId
          };
          
          // Add page_size parameter for admin users to get more leads at once
          if (userRole === 'admin') {
            apiParams.page_size = 100;
          }

          // Add no activity filter if selected
          if (activeFilters.no_activity_period?.length) {
            apiParams.no_activity_days = activeFilters.no_activity_period[0];
          }
          
          // Use the by-role endpoint which now has our custom ordering
          const response = await api.get('leads/by-role/', { params: apiParams });
          
          // Process response data
          let leadsArray = Array.isArray(response.data) 
            ? response.data
            : (response.data?.results && Array.isArray(response.data.results))
              ? response.data.results
              : [];
          
          // Extract all assigned user IDs - check multiple possible field names
          const userIds = new Set();
          leadsArray.forEach(lead => {
            // Check all possible field names for assigned user ID
            const assignedUserId = lead.assigned_to_id || lead.assigned_to || null;
            
            if (assignedUserId && typeof assignedUserId !== 'object') {
              userIds.add(assignedUserId);
            }
          });
          
          // Fetch user data for all assigned_to users
          let userMap = {};
          if (userIds.size > 0) {
            try {
              // Make separate requests for each user ID to ensure we get data
              for (const userId of userIds) {
                try {
                  const userResponse = await api.get(`auth/users/${userId}/`);
                  
                  if (userResponse.data) {
                    const userData = userResponse.data;
                    const userName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email;
                    userMap[userId] = userName;
                  }
                } catch (userError) {
                  // Silently ignore user fetch errors
                }
              }
              
              // Also try the bulk endpoint as a fallback
              const usersResponse = await api.get('auth/users/', {
                params: {
                  tenant: tenantId,
                  ids: Array.from(userIds).join(',')
                }
              });
              
              // Add data from bulk response to the map
              if (usersResponse?.data) {
                const userData = Array.isArray(usersResponse.data) 
                  ? usersResponse.data 
                  : usersResponse.data.results || [];
                
                userData.forEach(user => {
                  const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
                  userMap[user.id] = userName;
                });
              }
            } catch (error) {
              // Silently ignore user fetch errors
            }
          }
          
          // Format the leads data with user names
          const formattedData = leadsArray.map(lead => {
            // Determine the assigned user ID from multiple possible fields
            const assignedUserId = lead.assigned_to_id || lead.assigned_to || null;
            
            return {
              ...lead,
              id: lead.id,
              lead_type_display: lead.lead_type_display || lead.get_lead_type_display || 
                                (lead.lead_type === 'hajj_package' ? 'Hajj Package' : 
                                 lead.lead_type === 'custom_umrah' ? 'Custom Umrah' : 
                                 lead.lead_type === 'readymade_umrah' ? 'Readymade Umrah' : 
                                 lead.lead_type === 'flight' ? 'Flight' : 
                                 lead.lead_type === 'visa' ? 'Visa' : 
                                 lead.lead_type === 'transfer' ? 'Transfer' : 
                                 lead.lead_type === 'ziyarat' ? 'Ziyarat' : lead.lead_type),
              status_display: lead.status_display || lead.get_status_display || 
                             (lead.status === 'new' ? 'New' : 
                              lead.status === 'qualified' ? 'Qualified' : 
                              lead.status === 'non_potential' ? 'Non-Potential' : 
                              lead.status === 'proposal' ? 'Proposal' : 
                              lead.status === 'negotiation' ? 'Negotiation' : 
                              lead.status === 'won' ? 'Won' : 
                              lead.status === 'lost' ? 'Lost' : lead.status),
              // Ensure lead_activity_status is properly formatted
              lead_activity_status: lead.lead_activity_status || 'active',
              // Make sure next_follow_up is available
              next_follow_up: lead.next_follow_up || null,
              // Resolve assigned_to_name with multiple fallback options, prioritizing assigned_to_details
              assigned_to_name: (() => {
                // First check if assigned_to_details exists and contains name information
                if (lead.assigned_to_details) {
                  const details = lead.assigned_to_details;
                  const firstName = details.first_name || '';
                  const lastName = details.last_name || '';
                  
                  if (firstName || lastName) {
                    const fullName = `${firstName} ${lastName}`.trim();
                    return fullName;
                  }
                  
                  // Fall back to email if name is not available
                  if (details.email) {
                    return details.email;
                  }
                }
                
                // If the API already provides assigned_to_name, use it
                if (lead.assigned_to_name) {
                  return lead.assigned_to_name;
                }
                
                // If assigned_to is an object with name information
                if (lead.assigned_to && typeof lead.assigned_to === 'object') {
                  const firstName = lead.assigned_to.first_name || '';
                  const lastName = lead.assigned_to.last_name || '';
                  const email = lead.assigned_to.email || '';
                  const name = `${firstName} ${lastName}`.trim() || email;
                  return name || 'Unknown User';
                }
                
                // Look up user in our map using either assigned_to_id or assigned_to
                if (assignedUserId && userMap[assignedUserId]) {
                  return userMap[assignedUserId];
                }
                
                // No assigned user
                return null;
              })(),
              department_name: lead.department_details?.name || 
                               (lead.department_name ? lead.department_name : 
                               (lead.department ? 
                                 (typeof lead.department === 'object' ? lead.department.name : 'Unknown') 
                                 : 'None')),
            };
          });
          
          // No need for client-side ordering as server provides sorted data
          setLeads(formattedData);
          setFilteredLeads(formattedData);
          setLoading(false);
        } catch (error) {
          setLoading(false);
          message.error('Failed to load leads. Please try again.');
        }
      };

      fetchLeads();
    }
  }, [user, userRole, tenantId, activeFilters.no_activity_period]);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFiltersAndSearch(query, activeFilters);
  };

  // Handle filter changes
  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
    applyFiltersAndSearch(searchQuery, filters);
  };

  // Apply both filters and search
  const applyFiltersAndSearch = (query, filters) => {
    let results = [...leads];
    
    // Apply search
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      results = results.filter(lead => 
        lead.name?.toLowerCase().includes(lowercasedQuery) ||
        lead.email?.toLowerCase().includes(lowercasedQuery) ||
        lead.phone?.includes(query)
      );
    }
    
    // Apply status filter
    if (filters.status?.length) {
      results = results.filter(lead => filters.status.includes(lead.status));
    }
    
    // Apply lead type filter
    if (filters.lead_type?.length) {
      results = results.filter(lead => filters.lead_type.includes(lead.lead_type));
    }
    
    // Apply activity status filter
    if (filters.lead_activity_status?.length) {
      results = results.filter(lead => filters.lead_activity_status.includes(lead.lead_activity_status));
    }

    // Apply follow up status filter with new options
    if (filters.follow_up_status?.length) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get start of current week (Sunday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      // Get end of current week (Saturday)
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
      endOfWeek.setHours(23, 59, 59, 999);
      
      // Get start of current month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Get end of current month
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      results = results.filter(lead => {
        if (!lead.next_follow_up) {
          return filters.follow_up_status.includes('not_scheduled');
        }

        const followUpDate = new Date(lead.next_follow_up);
        followUpDate.setHours(0, 0, 0, 0);
        
        // Check each selected filter option
        return filters.follow_up_status.some(status => {
          switch(status) {
            case 'today':
              return followUpDate.getTime() === today.getTime();
            
            case 'this_week':
              return followUpDate >= startOfWeek && followUpDate <= endOfWeek;
            
            case 'this_month':
              return followUpDate >= startOfMonth && followUpDate <= endOfMonth;
            
            case 'past_due':
              return followUpDate < today && !['won', 'lost'].includes(lead.status);
            
            case 'scheduled':
              return followUpDate >= today;
            
            case 'not_scheduled':
              return !lead.next_follow_up;
            
            default:
              return false;
          }
        });
      });
    }
    
    // No need to filter no_activity_period here as it's handled by the API
    
    setFilteredLeads(results);
  };

  // Handle export
  const handleExport = (data, format, filename) => {
    // Basic CSV export implementation
    if (format === 'csv') {
      try {
        // Define headers based on columns
        const headers = columns.map(col => col.headerName);
        
        // Map data to rows
        const rows = data.map(item => {
          return columns.map(col => {
            const value = item[col.field];
            // Format dates
            if (col.field === 'next_follow_up') {
              return value ? new Date(value).toLocaleDateString() : '';
            }
            // Format display values
            if (col.field === 'status_display' || col.field === 'lead_type_display') {
              return value || '';
            }
            // Format activity status
            if (col.field === 'lead_activity_status') {
              return value === 'active' ? 'Active' : 'Inactive';
            }
            return value || '';
          });
        });
        
        // Combine headers and rows
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success(`Exported ${data.length} leads as CSV`);
      } catch (error) {
        message.error('Failed to export data');
      }
    } else {
      message.info(`Export as ${format} is not implemented yet`);
    }
  };

  // Handle create new lead
  const handleCreateLead = () => {
    navigate('/dashboard/leads/create');
  };

  // Handle view lead
  const handleViewLead = (lead) => {
    navigate(`/dashboard/leads/${lead.id}`);
  };

  // Handle edit lead
  const handleEditLead = (lead) => {
    navigate(`/dashboard/leads/${lead.id}/edit`);
  };

  // Handle delete lead
  const handleDeleteLead = async (lead) => {
    try {
      // Show loading message
      message.loading('Deleting lead...', 0);
      
      // Make the delete request
      await api.delete(`leads/${lead.id}/`);
      
      // Hide loading message
      message.destroy();
      
      // Show success message
      message.success(`Lead "${lead.name}" deleted successfully`);
      
      // Update the leads list by removing the deleted lead
      const updatedLeads = leads.filter(item => item.id !== lead.id);
      setLeads(updatedLeads);
      setFilteredLeads(filteredLeads.filter(item => item.id !== lead.id));
    } catch (error) {
      // Hide loading message
      message.destroy();
      
      // Show error message
      message.error('Failed to delete lead. Please try again.');
    }
  };

  // Get page title based on user role
  const getPageTitle = () => {
    if (!userRole) return 'Leads';
    
    switch(userRole) {
      case 'admin':
        return 'All Leads';
      case 'department_head':
        return `Department Leads`;
      case 'manager':
        return `Department Leads`;
      case 'team_lead':
        return 'Team Leads';
      case 'sales_agent':
        return 'My Sales Leads';
      case 'support_agent':
        return 'My Support Leads';
      case 'processor':
        return 'My Processing Leads';
      default:
        return 'My Leads';
    }
  };

  // Update refreshLeads function to use DataAccessService
  const refreshLeads = async () => {
    if (user && userRole && tenantId) {
      try {
        setLoading(true);
        
        const apiParams = {
          tenant: tenantId
        };
        
        // Note: We don't need to add ordering parameters as the backend now implements custom ordering
        
        // Add page_size parameter for admin users to get more leads at once
        if (userRole === 'admin') {
          apiParams.page_size = 100; // Request 100 leads for admin users
        }
        
        const response = await api.get('leads/by-role/', { params: apiParams });
        
        // Process response data
        let leadsArray = Array.isArray(response.data) 
          ? response.data
          : (response.data?.results && Array.isArray(response.data.results))
            ? response.data.results
            : [];
        
        // Extract all assigned user IDs - check multiple possible field names
        const userIds = new Set();
        leadsArray.forEach(lead => {
          // Check all possible field names for assigned user ID
          const assignedUserId = lead.assigned_to_id || lead.assigned_to || null;
          
          if (assignedUserId && typeof assignedUserId !== 'object') {
            userIds.add(assignedUserId);
          }
        });
        
        // Fetch user data for all assigned_to users
        let userMap = {};
        if (userIds.size > 0) {
          try {
            // Make separate requests for each user ID to ensure we get data
            for (const userId of userIds) {
              try {
                const userResponse = await api.get(`auth/users/${userId}/`);
                
                if (userResponse.data) {
                  const userData = userResponse.data;
                  const userName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email;
                  userMap[userId] = userName;
                }
              } catch (userError) {
                // Silently ignore user fetch errors
              }
            }
            
            // Also try the bulk endpoint as a fallback
            const usersResponse = await api.get('auth/users/', {
              params: {
                tenant: tenantId,
                ids: Array.from(userIds).join(',')
              }
            });
            
            // Add data from bulk response to the map
            if (usersResponse?.data) {
              const userData = Array.isArray(usersResponse.data) 
                ? usersResponse.data 
                : usersResponse.data.results || [];
              
              userData.forEach(user => {
                const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
                userMap[user.id] = userName;
              });
            }
          } catch (error) {
            // Silently ignore user fetch errors
          }
        }
        
        // Format the leads data with user names
        const formattedData = leadsArray.map(lead => {
          // Determine the assigned user ID from multiple possible fields
          const assignedUserId = lead.assigned_to_id || lead.assigned_to || null;
          
          return {
            ...lead,
            id: lead.id,
            lead_type_display: lead.lead_type_display || lead.get_lead_type_display || 
                              (lead.lead_type === 'hajj_package' ? 'Hajj Package' : 
                               lead.lead_type === 'custom_umrah' ? 'Custom Umrah' : 
                               lead.lead_type === 'readymade_umrah' ? 'Readymade Umrah' : 
                               lead.lead_type === 'flight' ? 'Flight' : 
                               lead.lead_type === 'visa' ? 'Visa' : 
                               lead.lead_type === 'transfer' ? 'Transfer' : 
                               lead.lead_type === 'ziyarat' ? 'Ziyarat' : lead.lead_type),
            status_display: lead.status_display || lead.get_status_display || 
                           (lead.status === 'new' ? 'New' : 
                            lead.status === 'qualified' ? 'Qualified' : 
                            lead.status === 'non_potential' ? 'Non-Potential' : 
                            lead.status === 'proposal' ? 'Proposal' : 
                            lead.status === 'negotiation' ? 'Negotiation' : 
                            lead.status === 'won' ? 'Won' : 
                            lead.status === 'lost' ? 'Lost' : lead.status),
            // Ensure lead_activity_status is properly formatted
            lead_activity_status: lead.lead_activity_status || 'active',
            // Make sure next_follow_up is available
            next_follow_up: lead.next_follow_up || null,
            // Resolve assigned_to_name with multiple fallback options, prioritizing assigned_to_details
            assigned_to_name: (() => {
              // First check if assigned_to_details exists and contains name information
              if (lead.assigned_to_details) {
                const details = lead.assigned_to_details;
                const firstName = details.first_name || '';
                const lastName = details.last_name || '';
                
                if (firstName || lastName) {
                  const fullName = `${firstName} ${lastName}`.trim();
                  return fullName;
                }
                
                // Fall back to email if name is not available
                if (details.email) {
                  return details.email;
                }
              }
              
              // If the API already provides assigned_to_name, use it
              if (lead.assigned_to_name) {
                return lead.assigned_to_name;
              }
              
              // If assigned_to is an object with name information
              if (lead.assigned_to && typeof lead.assigned_to === 'object') {
                const firstName = lead.assigned_to.first_name || '';
                const lastName = lead.assigned_to.last_name || '';
                const email = lead.assigned_to.email || '';
                const name = `${firstName} ${lastName}`.trim() || email;
                return name || 'Unknown User';
              }
              
              // Look up user in our map using either assigned_to_id or assigned_to
              if (assignedUserId && userMap[assignedUserId]) {
                return userMap[assignedUserId];
              }
              
              // No assigned user
              return null;
            })(),
            department_name: lead.department_details?.name || 
                             (lead.department_name ? lead.department_name : 
                             (lead.department ? 
                               (typeof lead.department === 'object' ? lead.department.name : 'Unknown') 
                               : 'None')),
          };
        });
        
        // No need for client-side ordering as server provides sorted data
        setLeads(formattedData);
        setFilteredLeads(formattedData);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        message.error('Failed to refresh leads. Please try again.');
      }
    }
  };

  // Add handler for bulk upload
  const handleBulkUpload = async (file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lead_type', 'study_visa'); // For now, hardcoding study_visa type
      
      // Create the full URL for debugging
      const apiUrl = 'leads/bulk-upload/';
      
      const response = await api.post(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          tenant: tenantId,
        },
      });
      
      if (response.data.success) {
        message.success(`Successfully uploaded ${response.data.created_count || 'multiple'} leads`);
        refreshLeads(); // Refresh the leads list
      } else {
        message.error(response.data.message || 'Failed to upload leads');
      }
    } catch (error) {
      message.error(`Failed to upload leads: ${error.response?.data?.error || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: 'white',
              position: 'relative'
            }}
          >
            {/* Pull-to-refresh indicator for mobile */}
            {refreshing && isMobileView && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '8px',
                  backgroundColor: 'rgba(157, 39, 124, 0.1)',
                  zIndex: 1
                }}
              >
                <Typography variant="caption" color="primary">Refreshing...</Typography>
              </Box>
            )}
            
            {/* Header Section with Title and Buttons */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              justifyContent: 'space-between', 
              alignItems: { xs: 'stretch', sm: 'center' }, 
              mb: 3,
              gap: 2
            }}>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
                {getPageTitle()}
              </Typography>
              
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                <DownloadButton 
                  data={filteredLeads}
                  filename="leads"
                  onExport={handleExport}
                />
                <BulkUploadButton
                  onUpload={handleBulkUpload}
                  buttonText="Bulk Upload Leads"
                />
                <CreateButton 
                  onClick={handleCreateLead}
                  buttonText="Add new lead"
                  icon="person"
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                />
              </Stack>
            </Box>
            
            {/* Search and Filter Row */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              mb: 3, 
              gap: 2 
            }}>
              <Box sx={{ width: '100%', flexGrow: 1 }}>
                <SearchBar 
                  placeholder="Search by name, email or phone..." 
                  onSearch={handleSearch}
                />
              </Box>
              <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <FilterButton 
                  filters={filterOptions}
                  onFilterChange={handleFilterChange}
                />
              </Box>
            </Box>
            
            {/* Show TableSkeleton during loading, TableList when data is ready */}
            {loading ? (
              <TableSkeleton 
                columns={columns.length} 
                rows={10} 
                dense={false} 
              />
            ) : (
              <TableList
                columns={columns}
                data={filteredLeads}
                loading={false}
                onRowClick={handleViewLead}
                onEditClick={handleEditLead}
                onDeleteClick={userRole === 'admin' ? handleDeleteLead : null}
                pagination={true}
                rowsPerPage={10}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                defaultSortField={null}
                defaultSortDirection="asc"
                getRowHighlight={getRowHighlight}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LeadsIndex;
