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

const TravelPackageIndex = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});

  // Add authentication check
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
      field: 'packageName', 
      headerName: 'NAME', 
      width: '25%',
      minWidth: 150,
      sortable: true 
    },
    { 
      field: 'packageType', 
      headerName: 'TYPE', 
      width: '15%',
      minWidth: 100,
      sortable: true,
      render: (value) => value === 'LOCAL' ? 'Local' : 'International'
    },
    { 
      field: 'travel_date', 
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
      field: 'is_group', 
      headerName: 'GROUP', 
      width: '10%',
      minWidth: 80,
      sortable: true,
      render: (value) => (
        value ? 
        <Chip 
          label="Group" 
          size="small" 
          sx={{ 
            backgroundColor: 'rgba(46, 204, 113, 0.2)', 
            color: 'rgb(46, 204, 113)',
            fontWeight: 500,
            borderRadius: '4px'
          }} 
        /> : 
        <Chip 
          label="Individual" 
          size="small" 
          sx={{ 
            backgroundColor: 'rgba(52, 152, 219, 0.2)', 
            color: 'rgb(52, 152, 219)',
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
      name: 'packageType',
      label: 'Package Type',
      options: [
        { value: 'LOCAL', label: 'Local' },
        { value: 'INTERNATIONAL', label: 'International' }
      ]
    },
    {
      name: 'is_group',
      label: 'Group Type',
      options: [
        { value: true, label: 'Group' },
        { value: false, label: 'Individual' }
      ]
    }
  ];

  // Fetch data from API
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const endpoint = API_ENDPOINTS.TRAVEL_PACKAGES.LIST.replace(/^\/api\//, '');
        const response = await api.get(endpoint);
        
        let packagesArray = Array.isArray(response.data) 
          ? response.data
          : (response.data?.results && Array.isArray(response.data.results))
            ? response.data.results
            : [];
            
        if (packagesArray.length === 0 && response.data && response.data.id && response.data.packageName) {
          packagesArray = [response.data];
        }
        
        const formattedData = packagesArray.map(pkg => ({
          ...pkg,
          id: pkg.id,
          packageName: pkg.packageName || 'Unnamed Package',
          travel_date: pkg.travel_date || null,
          return_date: pkg.return_date || null,
          is_group: typeof pkg.is_group === 'boolean' ? pkg.is_group : false
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
        pkg.packageName?.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    // Apply filters
    if (filters.packageType?.length) {
      results = results.filter(pkg => 
        filters.packageType.includes(pkg.packageType)
      );
    }
    
    if (filters.is_group?.length) {
      results = results.filter(pkg => 
        filters.is_group.includes(pkg.is_group)
      );
    }
    
    setFilteredPackages(results);
  };

  // Handle export
  const handleExport = (data, format, filename) => {
    if (format === 'csv') {
      try {
        const headers = columns.map(col => col.headerName);
        
        const rows = data.map(item => {
          return columns.map(col => {
            const value = item[col.field];
            if (col.field === 'travel_date' || col.field === 'return_date') {
              return value ? new Date(value).toLocaleDateString() : '';
            }
            if (col.field === 'is_group') {
              return value ? 'Group' : 'Individual';
            }
            if (col.field === 'packageType') {
              return value === 'LOCAL' ? 'Local' : 'International';
            }
            return value || '';
          });
        });
        
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');
        
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
    navigate('/dashboard/travel/travel-packages/create');
  };

  // Handle view package
  const handleViewPackage = (pkg) => {
    navigate(`/dashboard/travel/travel-packages/${pkg.id}`);
  };

  // Handle edit package
  const handleEditPackage = (pkg) => {
    navigate(`/dashboard/travel/travel-packages/${pkg.id}/edit`);
  };

  // Handle delete package
  const handleDeletePackage = async (pkg) => {
    try {
      message.loading('Deleting package...', 0);
      const endpoint = `travel-packages/${pkg.id}/`;
      await api.delete(endpoint);
      message.destroy();
      message.success(`Package "${pkg.packageName}" deleted successfully`);
      const updatedPackages = packages.filter(item => item.id !== pkg.id);
      setPackages(updatedPackages);
      setFilteredPackages(filteredPackages.filter(item => item.id !== pkg.id));
    } catch (error) {
      message.destroy();
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
                Travel Packages
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <DownloadButton 
                  data={filteredPackages}
                  filename="travel-packages"
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
              defaultSortField="packageName"
              defaultSortDirection="asc"
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TravelPackageIndex;
