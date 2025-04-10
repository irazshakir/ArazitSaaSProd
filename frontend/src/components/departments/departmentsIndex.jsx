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

const DepartmentsIndex = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [tenantId, setTenantId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshData, setRefreshData] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);

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
      refreshDepartments();
    }
  }, [location.pathname, tenantId]);

  // Define table columns
  const columns = [
    { 
      field: 'name', 
      headerName: 'DEPARTMENT NAME', 
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

  // Function to refresh departments
  const refreshDepartments = async () => {
    try {
      setLoading(true);
      await fetchDepartments();
      setLoading(false);
    } catch (error) {
      console.error('Error refreshing departments:', error);
      setLoading(false);
    }
  };

  // Fetch departments data from API
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('departments/', {
        params: {
          page: page,
          page_size: pageSize,
          search: searchTerm
        }
      });
      
      if (response.data && response.data.results) {
        // Format departments with branch names
        const formattedDepartments = response.data.results.map(dept => ({
          ...dept,
          branch_name: dept.branch ? dept.branch.name : 'No Branch'
        }));
        
        setDepartments(formattedDepartments);
        setTotalCount(response.data.count || 0);
      }
    } catch (error) {
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
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
    let results = [...departments];
    
    // Apply search
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      results = results.filter(department => 
        department.name?.toLowerCase().includes(lowercasedQuery) ||
        department.description?.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    // Apply status filter if present
    if (filters.status?.length) {
      results = results.filter(department => {
        if (filters.status.includes('active') && department.is_active) {
          return true;
        }
        if (filters.status.includes('inactive') && !department.is_active) {
          return true;
        }
        return false;
      });
    }
    
    setFilteredDepartments(results);
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
        
        message.success(`Exported ${data.length} departments as CSV`);
      } catch (error) {
        message.error('Failed to export data');
      }
    } else {
      message.info(`Export as ${format} is not implemented yet`);
    }
  };

  // Handle create new department
  const handleCreateDepartment = () => {
    navigate('/dashboard/departments/create');
  };

  // Handle view department
  const handleViewDepartment = (department) => {
    navigate(`/dashboard/departments/${department.id}`);
  };

  // Handle edit department
  const handleEditDepartment = (department) => {
    navigate(`/dashboard/departments/${department.id}/edit`);
  };

  // Handle delete department
  const handleDeleteDepartment = async (department) => {
    try {
      // Show loading message
      message.loading('Deleting department...', 0);
      
      // Try multiple endpoints for deletion
      const endpoints = [
        `departments/${department.id}/`,
        `users/departments/${department.id}/`,
        `auth/departments/${department.id}/`
      ];
      
      let success = false;
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          await api.delete(endpoint);
          success = true;
          break;
        } catch (error) {
          console.error(`Failed to delete with endpoint ${endpoint}:`, error);
          lastError = error;
        }
      }
      
      // Hide loading message
      message.destroy();
      
      if (success) {
        // Show success message
        message.success(`Department "${department.name}" deleted successfully`);
        
        // Update the departments list
        const updatedDepartments = departments.filter(item => item.id !== department.id);
        setDepartments(updatedDepartments);
        setFilteredDepartments(filteredDepartments.filter(item => item.id !== department.id));
      } else {
        throw lastError || new Error('All deletion attempts failed');
      }
    } catch (error) {
      // Hide loading message
      message.destroy();
      
      // Show error message
      message.error('Failed to delete department. Please try again.');
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteSuccess = () => {
    setRefreshData(prev => !prev);
    message.success('Department deleted successfully');
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
                Departments
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <DownloadButton 
                  data={filteredDepartments}
                  filename="departments"
                  onExport={handleExport}
                />
                <CreateButton 
                  onClick={handleCreateDepartment}
                  buttonText="Add Department"
                  icon="category"
                />
              </Stack>
            </Box>
            
            {/* Search and Filter Row */}
            <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <SearchBar 
                  placeholder="Search departments by name or description..." 
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
              data={filteredDepartments}
              loading={loading}
              onRowClick={handleViewDepartment}
              onEditClick={handleEditDepartment}
              onDeleteClick={handleDeleteDepartment}
              pagination={true}
              rowsPerPage={10}
              defaultSortField="name"
              defaultSortDirection="asc"
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DepartmentsIndex; 