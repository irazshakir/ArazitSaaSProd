import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Stack, Grid, Paper, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { message } from 'antd';
import { API_ENDPOINTS } from '../../config/api';

// Import universal components
import SearchBar from '../universalComponents/searchBar';
import DownloadButton from '../universalComponents/downloadButton';
import FilterButton from '../universalComponents/filterButton';
import CreateButton from '../universalComponents/createButton';
import TableList from '../universalComponents/tableList';

// API configuration
import { getToken, isAuthenticated, ensureAuthenticated } from '../../utils/auth';

const HajjPackagesIndex = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});

  // Add authentication check
  useEffect(() => {
    // Direct access to localStorage for authentication
    const token = localStorage.getItem('token');
    
    if (!token) {
      // Redirect to login if no token found
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Define table columns
  const columns = [
    { 
      field: 'package_name', 
      headerName: 'NAME', 
      width: '25%',
      minWidth: 150,
      sortable: true 
    },
    { 
      field: 'departure_date', 
      headerName: 'TRAVEL DATE', 
      width: '20%',
      minWidth: 130,
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    { 
      field: 'return_date', 
      headerName: 'RETURN DATE', 
      width: '20%',
      minWidth: 130,
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    { 
      field: 'is_active', 
      headerName: 'STATUS', 
      width: '20%',
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
    const fetchPackages = async () => {
      try {
        setLoading(true);
        
        // The API_ENDPOINTS.HAJJ_PACKAGES.LIST already includes '/api/' prefix
        // But the api instance also adds '/api/' because of its baseURL configuration
        // So we need to remove the '/api/' prefix from the endpoint to avoid duplication
        const endpoint = API_ENDPOINTS.HAJJ_PACKAGES.LIST.replace(/^\/api\//, '');
        const response = await api.get(endpoint);
        
        // Check if response.data is directly an array or has a results property (DRF pagination)
        let packagesArray = Array.isArray(response.data) 
          ? response.data
          : (response.data?.results && Array.isArray(response.data.results))
            ? response.data.results
            : [];
            
        // If we couldn't find an array, but response.data has package-like properties, treat it as a single item
        if (packagesArray.length === 0 && response.data && response.data.id && response.data.package_name) {
          packagesArray = [response.data];
        }
        
        // Transform data for UI representation
        const formattedData = packagesArray.map(pkg => ({
          ...pkg,
          id: pkg.id, // Ensure id field for table operations
          // Ensure these fields are present for sorting and filtering
          package_name: pkg.package_name || 'Unnamed Package',
          departure_date: pkg.departure_date || null,
          return_date: pkg.return_date || null,
          is_active: typeof pkg.is_active === 'boolean' ? pkg.is_active : true
        }));
        
        setPackages(formattedData);
        setFilteredPackages(formattedData);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        message.error('Failed to load packages. Please try again.');
      }
    };

    fetchPackages();
  }, []);

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
    let results = [...packages];
    
    // Apply search
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      results = results.filter(pkg => 
        pkg.package_name?.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    // Apply filters
    if (filters.status?.length) {
      results = results.filter(pkg => {
        const status = pkg.is_active ? 'active' : 'inactive';
        return filters.status.includes(status);
      });
    }
    
    setFilteredPackages(results);
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
            if (col.field === 'departure_date' || col.field === 'return_date') {
              return value ? new Date(value).toLocaleDateString() : '';
            }
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
        
        message.success(`Exported ${data.length} packages as CSV`);
      } catch (error) {
        message.error('Failed to export data');
      }
    } else {
      message.info(`Export as ${format} is not implemented yet`);
    }
  };

  // Handle create new package
  const handleCreatePackage = () => {
    navigate('/dashboard/hajj-umrah/hajj-packages/create');
  };

  // Handle view package
  const handleViewPackage = (pkg) => {
    navigate(`/dashboard/hajj-umrah/hajj-packages/${pkg.id}`);
  };

  // Handle edit package
  const handleEditPackage = (pkg) => {
    navigate(`/dashboard/hajj-umrah/hajj-packages/${pkg.id}/edit`);
  };

  // Handle delete package
  const handleDeletePackage = async (pkg) => {
    try {
      // Show loading message
      message.loading('Deleting package...', 0);
      
      // Remove '/api/' prefix to avoid duplication
      const endpoint = `hajj-packages/${pkg.id}/`;
      
      // Make the delete request
      await api.delete(endpoint);
      
      // Hide loading message
      message.destroy();
      
      // Show success message
      message.success(`Package "${pkg.package_name}" deleted successfully`);
      
      // Update the packages list by removing the deleted package
      const updatedPackages = packages.filter(item => item.id !== pkg.id);
      setPackages(updatedPackages);
      setFilteredPackages(filteredPackages.filter(item => item.id !== pkg.id));
    } catch (error) {
      // Hide loading message
      message.destroy();
      
      // Show error message
      message.error('Failed to delete package. Please try again.');
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
                Hajj Packages
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <DownloadButton 
                  data={filteredPackages}
                  filename="hajj-packages"
                  onExport={handleExport}
                />
                <CreateButton 
                  onClick={handleCreatePackage}
                  buttonText="Add new"
                />
              </Stack>
            </Box>
            
            {/* Search and Filter Row */}
            <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <SearchBar 
                  placeholder="Search package name..." 
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
              data={filteredPackages}
              loading={loading}
              onViewClick={handleViewPackage}
              onEditClick={handleEditPackage}
              onDeleteClick={handleDeletePackage}
              pagination={true}
              rowsPerPage={10}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              defaultSortField="package_name"
              defaultSortDirection="asc"
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HajjPackagesIndex;
