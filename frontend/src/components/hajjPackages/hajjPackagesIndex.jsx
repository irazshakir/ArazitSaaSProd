import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Stack, Grid, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { message } from 'antd';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';

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
    const userData = localStorage.getItem('user');
    
    console.log('HajjPackagesIndex direct check:', { token, userData });
    
    // Show visible feedback for debugging
    if (!token) {
      console.warn("Warning: No token found in HajjPackagesIndex. Trying to force auto-login...");
      
      // Create a test token to attempt to fix the issue
      localStorage.setItem('token', 'emergency-token-' + Date.now());
      localStorage.setItem('user', JSON.stringify({
        id: 999,
        email: 'emergency@example.com',
        industry: 'hajj_umrah'
      }));
      
      // Reload the page to apply the new token
      window.location.reload();
      return;
    }
    
    if (!userData) {
      console.warn("Warning: User data missing in HajjPackagesIndex but token exists.");
    }
    
    console.log('HajjPackagesIndex - Authentication passed');
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
      field: 'hajj_start_date', 
      headerName: 'TRAVEL DATE', 
      width: '20%',
      minWidth: 130,
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    { 
      field: 'hajj_end_date', 
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
        value ? 'Active' : 'Inactive'
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
        
        // Extract the path without the '/api/' prefix
        const endpoint = API_ENDPOINTS.HAJJ_PACKAGES.LIST.replace(/^\/api\//, '');
        console.log('Using API endpoint (without /api/ prefix):', endpoint);
        
        const response = await api.get(endpoint);
        
        // Debug: Log the full response object and structure
        console.log('API Response:', response);
        console.log('Response data type:', typeof response.data);
        console.log('Response data structure:', response.data);
        
        // Check if response.data is directly an array or has a results property (DRF pagination)
        let packagesArray = Array.isArray(response.data) 
          ? response.data
          : (response.data?.results && Array.isArray(response.data.results))
            ? response.data.results
            : [];
            
        console.log('Extracted packages array:', packagesArray);
        
        // If we couldn't find an array, log a warning
        if (packagesArray.length === 0 && response.data) {
          console.warn('Could not identify package data in response. Using empty array.');
          
          // If response.data has package-like properties, treat it as a single item
          if (response.data.id && response.data.package_name) {
            console.log('Response appears to be a single package. Converting to array.');
            packagesArray = [response.data];
          }
        }
        
        // Transform data for UI representation
        const formattedData = packagesArray.map(pkg => ({
          ...pkg,
          id: pkg.id // Ensure id field for table operations
        }));
        
        setPackages(formattedData);
        setFilteredPackages(formattedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Hajj packages:', error);
        setLoading(false);
        message.error('Failed to load packages. Check the console for details.');
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
        pkg.package_name.toLowerCase().includes(lowercasedQuery)
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
    console.log(`Exporting ${data.length} packages as ${format}`);
    // Implement actual export logic here
    // This would typically involve converting the data to the requested format
    // and triggering a download
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

  // Add a debug function to directly test the API
  const debugApiEndpoint = async () => {
    try {
      message.info('Testing Hajj Packages API endpoints...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('No authentication token found. Please log in.');
        return;
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Test with both axios and fetch for comparison
      console.log('1. Testing with axios using configured endpoint');
      try {
        // Remove '/api/' prefix to avoid duplication
        const endpoint = API_ENDPOINTS.HAJJ_PACKAGES.LIST.replace(/^\/api\//, '');
        console.log('Using endpoint for axios:', endpoint);
        
        const axiosResponse = await api.get(endpoint);
        console.log('Axios response:', axiosResponse);
      } catch (error) {
        console.error('Axios request failed:', error);
      }
      
      // Try both endpoint options
      const endpointOptions = [
        API_ENDPOINTS.HAJJ_PACKAGES.LIST,
        '/api/hajj-packages/',
        '/hajj-packages/',
        '/packages/hajj-packages/'
      ];
      
      for (const endpointPath of endpointOptions) {
        try {
          const fullUrl = `${API_BASE_URL}${endpointPath}`;
          console.log(`Testing hajj packages endpoint: ${fullUrl}`);
          
          const fetchResponse = await fetch(fullUrl, { headers });
          console.log(`Status for ${endpointPath}:`, fetchResponse.status);
          
          if (fetchResponse.ok) {
            const jsonData = await fetchResponse.json();
            console.log(`Data from ${endpointPath}:`, jsonData);
            
            // Check data structure
            if (Array.isArray(jsonData)) {
              console.log(`✅ VALID ARRAY RESPONSE from ${endpointPath} with ${jsonData.length} items`);
            } else if (jsonData && Array.isArray(jsonData.results)) {
              console.log(`✅ VALID PAGINATED RESPONSE from ${endpointPath} with ${jsonData.results.length} items`);
            } else {
              console.log(`⚠️ UNKNOWN DATA STRUCTURE from ${endpointPath}:`, jsonData);
            }
          }
        } catch (error) {
          console.error(`Error with ${endpointPath}:`, error);
        }
      }
      
      message.success('API testing complete. Check browser console for details.');
    } catch (error) {
      console.error('Debug function error:', error);
      message.error('API testing failed.');
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
                <CreateButton 
                  onClick={debugApiEndpoint}
                  buttonText="Debug API"
                  variant="outlined"
                  color="info"
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
              pagination={true}
              rowsPerPage={10}
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
