import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Stack, Grid, Paper, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { message } from 'antd';

// Import universal components
import SearchBar from '../universalComponents/searchBar';
import DownloadButton from '../universalComponents/downloadButton';
import FilterButton from '../universalComponents/filterButton';
import CreateButton from '../universalComponents/createButton';
import TableList from '../universalComponents/tableList';

const CannedIndex = () => {
  const navigate = useNavigate();
  const [cannedMessages, setCannedMessages] = useState([]);
  const [filteredCannedMessages, setFilteredCannedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Define table columns
  const columns = [
    { 
      field: 'template_name', 
      headerName: 'NAME', 
      width: '25%',
      minWidth: 180,
      sortable: true 
    },
    { 
      field: 'template_message', 
      headerName: 'MESSAGE TEMPLATE', 
      width: '45%',
      minWidth: 250,
      sortable: false,
      render: (value) => {
        // Truncate long messages for display
        return value && value.length > 100 ? `${value.substring(0, 100)}...` : value;
      }
    },
    { 
      field: 'created_by_email', 
      headerName: 'CREATED BY', 
      width: '20%',
      minWidth: 150,
      sortable: true,
      render: (value) => value || 'System'
    },
    { 
      field: 'is_active', 
      headerName: 'STATUS', 
      width: '10%',
      minWidth: 100,
      sortable: true,
      type: 'status',
      render: (value) => (
        value ? 
        <Chip 
          label="Active" 
          size="small" 
          sx={{ 
            backgroundColor: 'rgba(46, 204, 113, 0.2)', 
            color: 'rgb(46, 204, 113)',
            fontWeight: 500,
            borderRadius: '4px'
          }} 
        /> : 
        <Chip 
          label="Inactive" 
          size="small" 
          sx={{ 
            backgroundColor: 'rgba(231, 76, 60, 0.2)', 
            color: 'rgb(231, 76, 60)',
            fontWeight: 500,
            borderRadius: '4px'
          }} 
        />
      )
    }
  ];

  // Filter options
  const filterOptions = [
    {
      name: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ];

  // Fetch data from API
  useEffect(() => {
    const fetchCannedMessages = async () => {
      try {
        setLoading(true);
        
        // Get the tenant_id from localStorage
        const tenantId = localStorage.getItem('tenant_id');
        
        if (!tenantId) {
          message.error('Tenant information not found. Please log in again.');
          navigate('/login');
          return;
        }
        
        // Use the canned-messages endpoint
        const response = await api.get('canned-messages/', {
          headers: {
            'X-Tenant-ID': tenantId
          }
        });
        
        // Check if response.data is directly an array or has a results property
        let messagesArray = Array.isArray(response.data) 
          ? response.data
          : (response.data?.results && Array.isArray(response.data.results))
            ? response.data.results
            : [];
        
        setCannedMessages(messagesArray);
        setFilteredCannedMessages(messagesArray);
        setLoading(false);
      } catch (error) {
        message.error('Failed to load canned messages. Please try again.');
        setLoading(false);
      }
    };

    fetchCannedMessages();
  }, [navigate]);

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
    let results = [...cannedMessages];
    
    // Apply search
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      results = results.filter(template => 
        template.template_name?.toLowerCase().includes(lowercasedQuery) ||
        template.template_message?.toLowerCase().includes(lowercasedQuery) ||
        template.created_by_email?.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    // Apply status filter
    if (filters.status?.length) {
      results = results.filter(template => {
        const status = template.is_active ? 'active' : 'inactive';
        return filters.status.includes(status);
      });
    }
    
    setFilteredCannedMessages(results);
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
            
            // Format boolean values
            if (col.field === 'is_active') {
              return value ? 'Active' : 'Inactive';
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
        
        message.success(`Exported ${data.length} canned messages as CSV`);
      } catch (error) {
        message.error('Failed to export data');
      }
    } else {
      message.info(`Export as ${format} is not implemented yet`);
    }
  };

  // Handle create new template
  const handleCreateTemplate = () => {
    navigate('/dashboard/canned-messages/create');
  };

  // Handle view template
  const handleViewTemplate = (template) => {
    navigate(`/dashboard/canned-messages/${template.id}`);
  };

  // Handle edit template
  const handleEditTemplate = (template) => {
    navigate(`/dashboard/canned-messages/${template.id}/edit`);
  };

  // Handle toggle active status
  const handleToggleStatus = async (template) => {
    try {
      // Show loading message
      message.loading('Updating template status...', 0);
      
      // Make the patch request to toggle status
      await api.patch(`canned-messages/${template.id}/toggle_active/`, {}, {
        headers: {
          'X-Tenant-ID': localStorage.getItem('tenant_id')
        }
      });
      
      // Hide loading message
      message.destroy();
      
      // Show success message
      const newStatus = !template.is_active ? 'activated' : 'deactivated';
      message.success(`Template "${template.template_name}" ${newStatus} successfully`);
      
      // Update the templates list
      const updatedTemplates = cannedMessages.map(item => 
        item.id === template.id ? { ...item, is_active: !item.is_active } : item
      );
      
      setCannedMessages(updatedTemplates);
      setFilteredCannedMessages(
        filteredCannedMessages.map(item => 
          item.id === template.id ? { ...item, is_active: !item.is_active } : item
        )
      );
    } catch (error) {
      // Hide loading message
      message.destroy();
      message.error('Failed to update template status. Please try again.');
    }
  };

  // Handle delete template
  const handleDeleteTemplate = async (template) => {
    try {
      // Show loading message
      message.loading('Deleting template...', 0);
      
      // Make the delete request
      await api.delete(`canned-messages/${template.id}/`, {
        headers: {
          'X-Tenant-ID': localStorage.getItem('tenant_id')
        }
      });
      
      // Hide loading message
      message.destroy();
      
      // Show success message
      message.success(`Template "${template.template_name}" deleted successfully`);
      
      // Update the templates list
      const updatedTemplates = cannedMessages.filter(item => item.id !== template.id);
      setCannedMessages(updatedTemplates);
      setFilteredCannedMessages(filteredCannedMessages.filter(item => item.id !== template.id));
    } catch (error) {
      // Hide loading message
      message.destroy();
      message.error('Failed to delete template. Please try again.');
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
                Canned Messages
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <DownloadButton 
                  data={filteredCannedMessages}
                  filename="canned_messages"
                  onExport={handleExport}
                />
                <CreateButton 
                  onClick={handleCreateTemplate}
                  buttonText="Add Template"
                  icon="add"
                />
              </Stack>
            </Box>
            
            {/* Search and Filter Row */}
            <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <SearchBar 
                  placeholder="Search by name or message content..." 
                  onSearch={handleSearch}
                />
              </Box>
              <FilterButton 
                filters={filterOptions}
                onFilterChange={handleFilterChange}
              />
            </Box>
            
            {/* Data Table */}
            <TableList
              columns={columns}
              data={filteredCannedMessages}
              loading={loading}
              onViewClick={handleViewTemplate}
              onEditClick={handleEditTemplate}
              onDeleteClick={handleDeleteTemplate}
              pagination={true}
              rowsPerPage={10}
              defaultSortField="template_name"
              defaultSortDirection="asc"
              customActions={[
                {
                  label: (item) => item.is_active ? 'Deactivate' : 'Activate',
                  icon: (item) => item.is_active ? 'toggle_off' : 'toggle_on',
                  onClick: handleToggleStatus,
                  color: (item) => item.is_active ? 'warning' : 'success'
                }
              ]}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CannedIndex;
