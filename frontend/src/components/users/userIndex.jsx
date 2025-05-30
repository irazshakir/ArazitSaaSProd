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

const UserIndex = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  
  // Add pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

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
      field: 'email', 
      headerName: 'EMAIL', 
      width: '25%',
      minWidth: 180,
      sortable: true 
    },
    { 
      field: 'full_name', 
      headerName: 'NAME', 
      width: '20%',
      minWidth: 150,
      sortable: true,
    },
    { 
      field: 'role', 
      headerName: 'ROLE', 
      width: '15%',
      minWidth: 120,
      sortable: true,
      render: (value) => {
        const roles = {
          'admin': 'Admin',
          'department_head': 'Department Head',
          'manager': 'Manager',
          'team_lead': 'Team Lead',
          'sales_agent': 'Sales Agent',
          'support_agent': 'Support Agent',
          'processor': 'Processor'
        };
        return roles[value] || value;
      }
    },
    { 
      field: 'department_name', 
      headerName: 'DEPARTMENT', 
      width: '20%',
      minWidth: 150,
      sortable: true,
      render: (value) => value || 'None'
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
    },
    {
      name: 'role',
      label: 'Role',
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'department_head', label: 'Department Head' },
        { value: 'manager', label: 'Manager' },
        { value: 'team_lead', label: 'Team Lead' },
        { value: 'sales_agent', label: 'Sales Agent' },
        { value: 'support_agent', label: 'Support Agent' },
        { value: 'processor', label: 'Processor' }
      ]
    }
  ];

  // Fetch users with pagination
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get the tenant_id from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      
      if (!tenantId) {
        message.error('Tenant information not found. Please log in again.');
        navigate('/login');
        return;
      }
      
      // Prepare query parameters
      const params = {
        tenant: tenantId,
        page: page,
        page_size: pageSize
      };
      
      // Add search parameter if provided
      if (searchQuery) {
        params.search = searchQuery;
        // Add extra search parameters to improve matching
        params.search_fields = 'email,first_name,last_name,department__name';
      }
      
      // Use the correct endpoint with auth prefix
      const response = await api.get('auth/users/', { params });
      
      // Check if response.data has results property (DRF pagination)
      let usersArray = [];
      let total = 0;
      
      if (response.data?.results && Array.isArray(response.data.results)) {
        usersArray = response.data.results;
        total = response.data.count || 0;
      } else if (Array.isArray(response.data)) {
        usersArray = response.data;
        total = response.data.length;
      }
            
      // Transform data for UI representation
      const formattedData = usersArray.map(user => ({
        ...user,
        id: user.id,
        // Create a full name field for display
        full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        is_active: typeof user.is_active === 'boolean' ? user.is_active : true
      }));
      
      setUsers(formattedData);
      setFilteredUsers(formattedData);
      setTotalCount(total);
      setLoading(false);
    } catch (error) {
      // Try alternative endpoint if the first one fails with 404
      if (error.response && error.response.status === 404) {
        try {
          const params = {
            tenant: tenantId,
            page: page,
            page_size: pageSize
          };
          
          if (searchQuery) {
            params.search = searchQuery;
            params.search_fields = 'email,first_name,last_name,department__name';
          }
          
          const response = await api.get('users/', { params });
          
          // Process data as before
          let usersArray = [];
          let total = 0;
          
          if (response.data?.results && Array.isArray(response.data.results)) {
            usersArray = response.data.results;
            total = response.data.count || 0;
          } else if (Array.isArray(response.data)) {
            usersArray = response.data;
            total = response.data.length;
          }
                
          const formattedData = usersArray.map(user => ({
            ...user,
            id: user.id,
            full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            is_active: typeof user.is_active === 'boolean' ? user.is_active : true
          }));
          
          setUsers(formattedData);
          setFilteredUsers(formattedData);
          setTotalCount(total);
        } catch (secondError) {
          message.error('Failed to load users. Please try again.');
        }
      } else {
        message.error('Failed to load users. Please try again.');
      }
      
      setLoading(false);
    }
  };

  // Call fetchUsers when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, searchQuery]);

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on new search
  };

  // Handle filter changes
  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
    applyFilters(filters);
  };

  // Apply filters to the current dataset
  const applyFilters = (filters) => {
    let results = [...users];
    
    // Apply status filter
    if (filters.status?.length) {
      results = results.filter(user => {
        const status = user.is_active ? 'active' : 'inactive';
        return filters.status.includes(status);
      });
    }
    
    // Apply role filter
    if (filters.role?.length) {
      results = results.filter(user => 
        filters.role.includes(user.role)
      );
    }
    
    setFilteredUsers(results);
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
            
            // Format role values
            if (col.field === 'role') {
              const roles = {
                'admin': 'Admin',
                'department_head': 'Department Head',
                'manager': 'Manager',
                'team_lead': 'Team Lead',
                'sales_agent': 'Sales Agent',
                'support_agent': 'Support Agent',
                'processor': 'Processor'
              };
              return roles[value] || value;
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
        
        message.success(`Exported ${data.length} users as CSV`);
      } catch (error) {
        message.error('Failed to export data');
      }
    } else {
      message.info(`Export as ${format} is not implemented yet`);
    }
  };

  // Handle create new user
  const handleCreateUser = () => {
    navigate('/dashboard/users/create');
  };

  // Handle view user
  const handleViewUser = (user) => {
    navigate(`/dashboard/users/${user.id}`);
  };

  // Handle edit user
  const handleEditUser = (user) => {
    navigate(`/dashboard/users/${user.id}/edit`);
  };

  // Handle delete user
  const handleDeleteUser = async (user) => {
    try {
      // Show loading message
      message.loading('Deleting user...', 0);
      
      // Make the delete request with correct endpoint
      await api.delete(`auth/users/${user.id}/`);
      
      // Hide loading message
      message.destroy();
      
      // Show success message
      message.success(`User "${user.email}" deleted successfully`);
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      // Try alternative endpoint
      if (error.response && error.response.status === 404) {
        try {
          await api.delete(`users/${user.id}/`);
          
          // Hide loading message
          message.destroy();
          
          // Show success message
          message.success(`User "${user.email}" deleted successfully`);
          
          // Refresh users list
          fetchUsers();
        } catch (secondError) {
          // Hide loading message
          message.destroy();
          message.error('Failed to delete user. Please try again.');
        }
      } else {
        // Hide loading message
        message.destroy();
        message.error('Failed to delete user. Please try again.');
      }
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
                Users Management
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <DownloadButton 
                  data={filteredUsers}
                  filename="users"
                  onExport={handleExport}
                />
                <CreateButton 
                  onClick={handleCreateUser}
                  buttonText="Add User"
                  icon="person"
                />
              </Stack>
            </Box>
            
            {/* Search and Filter Row */}
            <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <SearchBar 
                  placeholder="Search by email, name or department..." 
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
              data={filteredUsers}
              loading={loading}
              onViewClick={handleViewUser}
              onEditClick={handleEditUser}
              onDeleteClick={handleDeleteUser}
              pagination={true}
              rowsPerPage={pageSize}
              page={page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              totalItems={totalCount}
              defaultSortField="email"
              defaultSortDirection="asc"
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserIndex;
