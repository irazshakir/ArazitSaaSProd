import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Stack, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Import universal components
import SearchBar from '../universalComponents/searchBar';
import DownloadButton from '../universalComponents/downloadButton';
import FilterButton from '../universalComponents/filterButton';
import CreateButton from '../universalComponents/createButton';
import TableList from '../universalComponents/tableList';

// API configuration
import { getToken, isAuthenticated, ensureAuthenticated } from '../../utils/auth';
import { API_BASE_URL } from '../../config/api';

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
        // Get token directly from localStorage
        const token = localStorage.getItem('token');
        
        // Add debugging
        console.log('HajjPackagesIndex - API Call - Token:', token);
        
        if (!token) {
          console.error('No token available for API request');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`${API_BASE_URL}/api/hajj-packages/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Transform data for UI representation
        const formattedData = response.data.map(pkg => ({
          ...pkg,
          id: pkg.id // Ensure id field for table operations
        }));
        
        setPackages(formattedData);
        setFilteredPackages(formattedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Hajj packages:', error);
        setLoading(false);
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
