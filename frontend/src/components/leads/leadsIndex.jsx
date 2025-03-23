import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Stack, Grid, Paper, Chip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { message } from 'antd';

// Import universal components
import SearchBar from '../universalComponents/searchBar';
import DownloadButton from '../universalComponents/downloadButton';
import FilterButton from '../universalComponents/filterButton';
import CreateButton from '../universalComponents/createButton';
import TableList from '../universalComponents/tableList';
import TableSkeleton from '../universalComponents/tableSkeleton';

// Import auth utilities
import { getUser } from '../../utils/auth';

const LeadsIndex = () => {
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
      const userRole = localStorage.getItem('role');
      const tenantId = localStorage.getItem('tenant_id');
      
      setUser(userData);
      setUserRole(userRole);
      setTenantId(tenantId);
      
      console.log('User data loaded:', { userData, userRole, tenantId });
      console.log('User data details:', {
        id: userData?.id,
        email: userData?.email,
        role: userRole,
        department: userData?.department,
        department_name: userData?.department_name,
        tenant_id: tenantId
      });
    } catch (error) {
      console.error('Error parsing user data:', error);
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

  // Define table columns
  const columns = [
    { 
      field: 'name', 
      headerName: 'NAME', 
      width: '20%',
      minWidth: 150,
      sortable: true 
    },
    { 
      field: 'phone', 
      headerName: 'PHONE', 
      width: '15%',
      minWidth: 120,
      sortable: true
    },
    { 
      field: 'assigned_to_name', 
      headerName: 'ASSIGNED TO', 
      width: '15%',
      minWidth: 120,
      sortable: true,
      render: (value) => value || 'Unassigned'
    },
    { 
      field: 'lead_type_display', 
      headerName: 'TYPE', 
      width: '15%',
      minWidth: 120,
      sortable: true
    },
    { 
      field: 'status_display', 
      headerName: 'STATUS', 
      width: '15%',
      minWidth: 100,
      sortable: true,
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
      field: 'created_at', 
      headerName: 'CREATED', 
      width: '15%',
      minWidth: 120,
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

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

  // Filter options
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
      options: [
        { value: 'hajj_package', label: 'Hajj Package' },
        { value: 'custom_umrah', label: 'Custom Umrah' },
        { value: 'readymade_umrah', label: 'Readymade Umrah' },
        { value: 'flight', label: 'Flight' },
        { value: 'visa', label: 'Visa' },
        { value: 'transfer', label: 'Transfer' },
        { value: 'ziyarat', label: 'Ziyarat' }
      ]
    },
    {
      name: 'lead_activity_status',
      label: 'Activity Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ];

  // Fetch data from API based on user role
  useEffect(() => {
    if (!user || !userRole || !tenantId) return;
    
    const fetchLeads = async () => {
      try {
        setLoading(true);
        
        // Determine endpoint and parameters based on user role
        let endpoint = 'leads/';
        const params = { tenant: tenantId };
        
        // Role-based API calls
        switch(userRole) {
          case 'admin':
            // Admin sees all leads for the tenant
            console.log('Admin role: Fetching all leads for tenant', tenantId);
            break;
          case 'department_head':
            // Department head sees all leads in their department
            if (user.department) {
              params.department = user.department; // Use department directly from user object
              console.log('Department Head role: Fetching leads for department', user.department, user.department_name);
            } else {
              // If no department, fetch all leads for the tenant (like admin)
              console.log('Department Head with no department: Fetching all leads for tenant', tenantId);
            }
            break;
          case 'manager':
            // Manager sees all leads in their department
            if (user.department) {
              params.department = user.department; // Use department directly from user object
              console.log('Manager role: Fetching leads for department', user.department, user.department_name);
            } else {
              // If no department, fetch all leads for the tenant (like admin)
              console.log('Manager with no department: Fetching all leads for tenant', tenantId);
            }
            break;
          case 'team_lead':
            // Team lead sees leads assigned to their team members
            params.team_lead = user.id; // Make sure parameter name matches backend
            console.log('Team Lead role: Fetching leads for team lead', user.id);
            break;
          default:
            // All other roles see only their assigned leads
            params.assigned_to = user.id; // This parameter name should match backend
            console.log('Agent role: Fetching leads assigned to', user.id);
            break;
        }
        
        console.log('API request parameters:', params);
        const response = await api.get(endpoint, { params });
        
        console.log('API response:', response);
        
        // Process response data
        let leadsArray = Array.isArray(response.data) 
          ? response.data
          : (response.data?.results && Array.isArray(response.data.results))
            ? response.data.results
            : [];
        
        console.log(`Fetched ${leadsArray.length} leads:`, leadsArray);
        
        // Extract all assigned user IDs - check multiple possible field names
        const userIds = new Set();
        leadsArray.forEach(lead => {
          // Check all possible field names for assigned user ID
          const assignedUserId = lead.assigned_to_id || lead.assigned_to || null;
          
          if (assignedUserId && typeof assignedUserId !== 'object') {
            userIds.add(assignedUserId);
            console.log(`Lead ${lead.id} has assigned user ID: ${assignedUserId}`);
          } else {
            console.log(`Lead ${lead.id} has no assigned user or assigned user is already an object`);
          }
        });
        
        console.log('Collected user IDs to fetch:', Array.from(userIds));
        
        // Fetch user data for all assigned_to users
        let userMap = {};
        if (userIds.size > 0) {
          try {
            console.log('Fetching user data for IDs:', Array.from(userIds));
            
            // Make separate requests for each user ID to ensure we get data
            for (const userId of userIds) {
              try {
                const userResponse = await api.get(`users/${userId}/`);
                console.log(`User data for ID ${userId}:`, userResponse.data);
                
                if (userResponse.data) {
                  const userData = userResponse.data;
                  const userName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email;
                  userMap[userId] = userName;
                  console.log(`Mapped user ID ${userId} to name: ${userName}`);
                }
              } catch (userError) {
                console.error(`Error fetching user with ID ${userId}:`, userError);
              }
            }
            
            // Also try the bulk endpoint as a fallback
            const usersResponse = await api.get('users/', {
              params: {
                tenant: tenantId,
                ids: Array.from(userIds).join(',')
              }
            });
            
            console.log('Bulk users API response:', usersResponse);
            
            // Add data from bulk response to the map
            if (usersResponse?.data) {
              const userData = Array.isArray(usersResponse.data) 
                ? usersResponse.data 
                : usersResponse.data.results || [];
              
              userData.forEach(user => {
                const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
                userMap[user.id] = userName;
                console.log(`Mapped user ID ${user.id} to name: ${userName} (from bulk)`);
              });
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
        
        console.log('Final user map:', userMap);
        
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
            // Resolve assigned_to_name with multiple fallback options, prioritizing assigned_to_details
            assigned_to_name: (() => {
              // First check if assigned_to_details exists and contains name information
              if (lead.assigned_to_details) {
                const details = lead.assigned_to_details;
                const firstName = details.first_name || '';
                const lastName = details.last_name || '';
                
                if (firstName || lastName) {
                  const fullName = `${firstName} ${lastName}`.trim();
                  console.log(`Lead ${lead.id} has assigned_to_details with name: ${fullName}`);
                  return fullName;
                }
                
                // Fall back to email if name is not available
                if (details.email) {
                  console.log(`Lead ${lead.id} has assigned_to_details with email: ${details.email}`);
                  return details.email;
                }
              }
              
              // If the API already provides assigned_to_name, use it
              if (lead.assigned_to_name) {
                console.log(`Lead ${lead.id} already has assigned_to_name: ${lead.assigned_to_name}`);
                return lead.assigned_to_name;
              }
              
              // If assigned_to is an object with name information
              if (lead.assigned_to && typeof lead.assigned_to === 'object') {
                const firstName = lead.assigned_to.first_name || '';
                const lastName = lead.assigned_to.last_name || '';
                const email = lead.assigned_to.email || '';
                const name = `${firstName} ${lastName}`.trim() || email;
                console.log(`Lead ${lead.id} has assigned_to as object, extracted name: ${name}`);
                return name || 'Unknown User';
              }
              
              // Look up user in our map using either assigned_to_id or assigned_to
              if (assignedUserId && userMap[assignedUserId]) {
                console.log(`Lead ${lead.id} assigned user found in map: ${userMap[assignedUserId]}`);
                return userMap[assignedUserId];
              }
              
              // No assigned user
              console.log(`Lead ${lead.id} has no assigned user or user not found`);
              return null;
            })()
          };
        });
        
        console.log('Formatted data:', formattedData);
        
        setLeads(formattedData);
        setFilteredLeads(formattedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching leads:', error);
        console.error('Error details:', error.response?.data);
        setLoading(false);
        message.error('Failed to load leads. Please try again.');
      }
    };

    fetchLeads();
  }, [user, userRole, tenantId]);

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
            if (col.field === 'created_at') {
              return value ? new Date(value).toLocaleDateString() : '';
            }
            // Format display values
            if (col.field === 'status_display' || col.field === 'lead_type_display') {
              return value || '';
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

  // Add a function to refresh leads data
  const refreshLeads = () => {
    if (user && userRole && tenantId) {
      const fetchLead = async () => {
        try {
          setLoading(true);
          
          // Determine endpoint and parameters based on user role
          let endpoint = 'leads/';
          const params = { tenant: tenantId };
          
          // Role-based API calls
          if (userRole === 'admin') {
            // Admin sees all leads for the tenant
            console.log('Admin role: Fetching all leads for tenant', tenantId);
          } else if (['department_head', 'manager'].includes(userRole) && user.department) {
            // Department head or manager sees all leads in their department
            params.department = user.department;
            console.log(`${userRole} role: Fetching leads for department`, user.department, user.department_name);
          } else if (userRole === 'team_lead') {
            // Team lead sees leads assigned to their team members
            params.team_lead = user.id;
            console.log('Team Lead role: Fetching leads for team lead', user.id);
          } else {
            // All other roles see only their assigned leads
            params.assigned_to = user.id;
            console.log('Agent role: Fetching leads assigned to', user.id);
          }
          
          console.log('Refreshing leads, API request parameters:', params);
          const response = await api.get(endpoint, { params });
          
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
              console.log(`Lead ${lead.id} has assigned user ID: ${assignedUserId}`);
            } else {
              console.log(`Lead ${lead.id} has no assigned user or assigned user is already an object`);
            }
          });
          
          console.log('Collected user IDs to fetch:', Array.from(userIds));
          
          // Fetch user data for all assigned_to users
          let userMap = {};
          if (userIds.size > 0) {
            try {
              console.log('Fetching user data for IDs:', Array.from(userIds));
              
              // Make separate requests for each user ID to ensure we get data
              for (const userId of userIds) {
                try {
                  const userResponse = await api.get(`users/${userId}/`);
                  console.log(`User data for ID ${userId}:`, userResponse.data);
                  
                  if (userResponse.data) {
                    const userData = userResponse.data;
                    const userName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email;
                    userMap[userId] = userName;
                    console.log(`Mapped user ID ${userId} to name: ${userName}`);
                  }
                } catch (userError) {
                  console.error(`Error fetching user with ID ${userId}:`, userError);
                }
              }
              
              // Also try the bulk endpoint as a fallback
              const usersResponse = await api.get('users/', {
                params: {
                  tenant: tenantId,
                  ids: Array.from(userIds).join(',')
                }
              });
              
              console.log('Bulk users API response:', usersResponse);
              
              // Add data from bulk response to the map
              if (usersResponse?.data) {
                const userData = Array.isArray(usersResponse.data) 
                  ? usersResponse.data 
                  : usersResponse.data.results || [];
                
                userData.forEach(user => {
                  const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
                  userMap[user.id] = userName;
                  console.log(`Mapped user ID ${user.id} to name: ${userName} (from bulk)`);
                });
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
            }
          }
          
          console.log('Final user map:', userMap);
          
          // Format the leads data with user names
          const formattedData = leadsArray.map(lead => {
            // Determine the assigned user ID from multiple possible fields
            const assignedUserId = lead.assigned_to_id || lead.assigned_to || null;
            console.log(`Processing lead ${lead.id}, assigned user ID: ${assignedUserId}`);
            
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
              // Resolve assigned_to_name with multiple fallback options, prioritizing assigned_to_details
              assigned_to_name: (() => {
                // First check if assigned_to_details exists and contains name information
                if (lead.assigned_to_details) {
                  const details = lead.assigned_to_details;
                  const firstName = details.first_name || '';
                  const lastName = details.last_name || '';
                  
                  if (firstName || lastName) {
                    const fullName = `${firstName} ${lastName}`.trim();
                    console.log(`Lead ${lead.id} has assigned_to_details with name: ${fullName}`);
                    return fullName;
                  }
                  
                  // Fall back to email if name is not available
                  if (details.email) {
                    console.log(`Lead ${lead.id} has assigned_to_details with email: ${details.email}`);
                    return details.email;
                  }
                }
                
                // If the API already provides assigned_to_name, use it
                if (lead.assigned_to_name) {
                  console.log(`Lead ${lead.id} already has assigned_to_name: ${lead.assigned_to_name}`);
                  return lead.assigned_to_name;
                }
                
                // If assigned_to is an object with name information
                if (lead.assigned_to && typeof lead.assigned_to === 'object') {
                  const firstName = lead.assigned_to.first_name || '';
                  const lastName = lead.assigned_to.last_name || '';
                  const email = lead.assigned_to.email || '';
                  const name = `${firstName} ${lastName}`.trim() || email;
                  console.log(`Lead ${lead.id} has assigned_to as object, extracted name: ${name}`);
                  return name || 'Unknown User';
                }
                
                // Look up user in our map using either assigned_to_id or assigned_to
                if (assignedUserId && userMap[assignedUserId]) {
                  console.log(`Lead ${lead.id} assigned user found in map: ${userMap[assignedUserId]}`);
                  return userMap[assignedUserId];
                }
                
                // No assigned user
                console.log(`Lead ${lead.id} has no assigned user or user not found`);
                return null;
              })()
            };
          });
          
          setLeads(formattedData);
          setFilteredLeads(formattedData);
          setLoading(false);
          
        } catch (error) {
          console.error('Error refreshing leads:', error);
          setLoading(false);
          message.error('Failed to refresh leads. Please try again.');
        }
      };
      
      fetchLead();
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
              backgroundColor: 'white'
            }}
          >
            {/* Header Section with Title and Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
                {getPageTitle()}
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <DownloadButton 
                  data={filteredLeads}
                  filename="leads"
                  onExport={handleExport}
                />
                <CreateButton 
                  onClick={handleCreateLead}
                  buttonText="Add new lead"
                  icon="person"
                />
              </Stack>
            </Box>
            
            {/* Search and Filter Row */}
            <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <SearchBar 
                  placeholder="Search by name, email or phone..." 
                  onSearch={handleSearch}
                />
              </Box>
              <FilterButton 
                filters={filterOptions}
                onFilterChange={handleFilterChange}
              />
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
                onDeleteClick={handleDeleteLead}
                pagination={true}
                rowsPerPage={10}
                defaultSortField="created_at"
                defaultSortDirection="desc"
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LeadsIndex;
