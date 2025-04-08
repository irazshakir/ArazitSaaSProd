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

const BranchesIndex = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [tenantId, setTenantId] = useState(null);

  // Get tenant ID from localStorage
  useEffect(() => {
    const tenantId = localStorage.getItem('tenant_id');
    if (!tenantId) {
      message.error('Tenant information is missing. Please log in again.');
      navigate('/login');
      return;
    }
    
    setTenantId(tenantId);
  }, [navigate]);

  // Add this effect to refresh when navigating to the page
  useEffect(() => {
    if (tenantId) {
      refreshBranches();
    }
  }, [location.pathname, tenantId]);

  // Define table columns
  const columns = [
    { 
      field: 'name', 
      headerName: 'BRANCH NAME', 
      width: '35%',
      minWidth: 180,
      sortable: true 
    },
    { 
      field: 'description', 
      headerName: 'DESCRIPTION', 
      width: '40%',
      minWidth: 200,
      sortable: false,
      render: (value) => value || 'No description'
    },
    { 
      field: 'created_at', 
      headerName: 'CREATED', 
      width: '15%',
      minWidth: 120,
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    { 
      field: 'is_active', 
      headerName: 'STATUS', 
      width: '10%',
      minWidth: 100,
      sortable: true,
      render: (value) => (
        <Chip 
          label={value ? 'Active' : 'Inactive'}
          size="small"
          sx={{ 
            borderRadius: '4px',
            backgroundColor: value ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
            color: value ? 'rgb(46, 204, 113)' : 'rgb(231, 76, 60)',
            fontWeight: 500
          }} 
        />
      )
    }
  ];

  // Function to refresh branches
  const refreshBranches = async () => {
    try {
      setLoading(true);
      await fetchBranches();
      setLoading(false);
    } catch (error) {
      console.error('Error refreshing branches:', error);
      setLoading(false);
    }
  };

  // Fetch branches data from API
  const fetchBranches = async () => {
    try {
      // Determine endpoint
      let endpoint = 'branches/';
      const params = { tenant: tenantId };
      
      console.log('API request parameters:', params);
      
      // Try 3 different API endpoints in sequence
      let response = null;
      let errorMessages = [];
      
      // Try main endpoint first
      try {
        response = await api.get(endpoint, { params });
        console.log('Main API response success:', response);
      } catch (error) {
        errorMessages.push(`Main endpoint error: ${error.message}`);
        console.log('Main API endpoint failed, trying fallback');
        
        // Try auth endpoint next
        try {
          response = await api.get(`auth/${endpoint}`, { params });
          console.log('Auth API response success:', response);
        } catch (error2) {
          errorMessages.push(`Auth endpoint error: ${error2.message}`);
          console.log('Auth API endpoint failed, trying without params');
          
          // Try without params as last resort
          try {
            response = await api.get(endpoint);
            console.log('API without params success:', response);
          } catch (error3) {
            errorMessages.push(`No params endpoint error: ${error3.message}`);
            console.error('All API attempts failed');
            throw new Error(`All API attempts failed: ${errorMessages.join(', ')}`);
          }
        }
      }
      
      if (!response) {
        throw new Error('No valid response from any API endpoint');
      }
      
      // Process response data
      let branchesArray = Array.isArray(response.data) 
        ? response.data
        : (response.data?.results && Array.isArray(response.data.results))
          ? response.data.results
          : [];
      
      console.log(`Fetched ${branchesArray.length} branches:`, branchesArray);
      
      // Transform data for UI representation
      const formattedData = branchesArray.map(branch => ({
        ...branch,
        id: branch.id,
        is_active: branch.is_active !== undefined ? branch.is_active : true
      }));
      
      console.log('Formatted branches data:', formattedData);
      
      setBranches(formattedData);
      setFilteredBranches(formattedData);
      
    } catch (error) {
      console.error('Error fetching branches:', error);
      console.error('Error details:', error.response?.data);
      
      // Show error message
      message.error('Failed to load branches. Please try again.');
      
      // Set empty state
      setBranches([]);
      setFilteredBranches([]);
    }
  };

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
    let results = [...branches];
    
    // Apply search
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      results = results.filter(branch => 
        branch.name?.toLowerCase().includes(lowercasedQuery) ||
        branch.description?.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    // Apply status filter if present
    if (filters.status?.length) {
      results = results.filter(branch => {
        if (filters.status.includes('active') && branch.is_active) {
          return true;
        }
        if (filters.status.includes('inactive') && !branch.is_active) {
          return true;
        }
        return false;
      });
    }
    
    setFilteredBranches(results);
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
            // Format booleans
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
        
        message.success(`Exported ${data.length} branches as CSV`);
      } catch (error) {
        message.error('Failed to export data');
      }
    } else {
      message.info(`Export as ${format} is not implemented yet`);
    }
  };

  // Handle create new branch
  const handleCreateBranch = () => {
    navigate('/dashboard/branches/create');
  };

  // Handle view branch
  const handleViewBranch = (branch) => {
    navigate(`/dashboard/branches/${branch.id}`);
  };

  // Handle edit branch
  const handleEditBranch = (branch) => {
    navigate(`/dashboard/branches/${branch.id}/edit`);
  };

  // Handle delete branch
  const handleDeleteBranch = async (branch) => {
    try {
      // Show loading message
      message.loading('Deleting branch...', 0);
      
      // Try 3 different API endpoints in sequence
      let deleteSuccessful = false;
      let errorMessages = [];
      
      // Try main endpoint first
      try {
        await api.delete(`branches/${branch.id}/`);
        console.log('Main API delete success');
        deleteSuccessful = true;
      } catch (error) {
        errorMessages.push(`Main endpoint error: ${error.message}`);
        console.log('Main API endpoint failed, trying fallback');
        
        // Try auth endpoint next
        try {
          await api.delete(`auth/branches/${branch.id}/`);
          console.log('Auth API delete success');
          deleteSuccessful = true;
        } catch (error2) {
          errorMessages.push(`Auth endpoint error: ${error2.message}`);
          console.log('Auth API endpoint failed, trying users endpoint');
          
          // Try users endpoint as last resort
          try {
            await api.delete(`users/branches/${branch.id}/`);
            console.log('Users API delete success');
            deleteSuccessful = true;
          } catch (error3) {
            errorMessages.push(`Users endpoint error: ${error3.message}`);
            console.error('All API attempts failed');
          }
        }
      }
      
      // Hide loading message
      message.destroy();
      
      if (!deleteSuccessful) {
        throw new Error(`All API attempts failed: ${errorMessages.join(', ')}`);
      }
      
      // Show success message
      message.success(`Branch "${branch.name}" deleted successfully`);
      
      // Update the branches list by removing the deleted branch
      const updatedBranches = branches.filter(item => item.id !== branch.id);
      setBranches(updatedBranches);
      setFilteredBranches(filteredBranches.filter(item => item.id !== branch.id));
      
      // Refresh the branches list to ensure sync with backend
      refreshBranches();
    } catch (error) {
      // Hide loading message
      message.destroy();
      
      // Show error message
      console.error('Error deleting branch:', error);
      message.error('Failed to delete branch. Please try again.');
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
                Branches
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <DownloadButton 
                  data={filteredBranches}
                  filename="branches"
                  onExport={handleExport}
                />
                <CreateButton 
                  onClick={handleCreateBranch}
                  buttonText="Add Branch"
                  icon="business"
                />
              </Stack>
            </Box>
            
            {/* Search and Filter Row */}
            <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <SearchBar 
                  placeholder="Search branches by name or description..." 
                  onSearch={handleSearch}
                />
              </Box>
              <FilterButton 
                filters={[
                  {
                    name: 'status',
                    label: 'Status',
                    options: [
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' }
                    ]
                  }
                ]}
                onFilterChange={handleFilterChange}
              />
            </Box>
            
            {/* Data Table */}
            <TableList
              columns={columns}
              data={filteredBranches}
              loading={loading}
              onRowClick={handleViewBranch}
              onEditClick={handleEditBranch}
              onDeleteClick={handleDeleteBranch}
              pagination={true}
              rowsPerPage={10}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              defaultSortField="name"
              defaultSortDirection="asc"
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default BranchesIndex; 