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

const DevelopmentProjectIndex = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
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
      field: 'project_name', 
      headerName: 'PROJECT NAME', 
      width: '25%',
      minWidth: 150,
      sortable: true 
    },
    { 
      field: 'property_type_display', 
      headerName: 'PROPERTY TYPE', 
      width: '15%',
      minWidth: 120,
      sortable: true
    },
    { 
      field: 'listing_type_display', 
      headerName: 'LISTING TYPE', 
      width: '15%',
      minWidth: 120,
      sortable: true
    },
    { 
      field: 'location', 
      headerName: 'LOCATION', 
      width: '20%',
      minWidth: 130,
      sortable: true
    },
    { 
      field: 'covered_size', 
      headerName: 'SIZE', 
      width: '10%',
      minWidth: 100,
      sortable: true
    }
  ];

  // Filter options
  const filterOptions = [
    {
      name: 'propertyType',
      label: 'Property Type',
      options: [
        { value: 'residential', label: 'Residential' },
        { value: 'commercial', label: 'Commercial' }
      ]
    },
    {
      name: 'listingType',
      label: 'Listing Type',
      options: [
        { value: 'house', label: 'House' },
        { value: 'flat', label: 'Flat' },
        { value: 'shop', label: 'Shop' },
        { value: 'building', label: 'Building' },
        { value: 'farmhouse', label: 'Farmhouse' },
        { value: 'plot', label: 'Plot' }
      ]
    }
  ];

  // Fetch data from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        
        // Use the API_ENDPOINTS configuration
        const endpoint = API_ENDPOINTS.DEVELOPMENT_PROJECTS.LIST;
        const response = await api.get(endpoint);
        
        // Check if response.data is directly an array or has a results property (DRF pagination)
        let projectsArray = Array.isArray(response.data) 
          ? response.data
          : (response.data?.results && Array.isArray(response.data.results))
            ? response.data.results
            : [];
            
        // If we couldn't find an array, but response.data has project-like properties, treat it as a single item
        if (projectsArray.length === 0 && response.data && response.data.id && response.data.project_name) {
          projectsArray = [response.data];
        }
        
        // Transform data for UI representation
        const formattedData = projectsArray.map(project => ({
          ...project,
          id: project.id, // Ensure id field for table operations
          // Ensure these fields are present for sorting and filtering
          project_name: project.project_name || 'Unnamed Project',
          property_type_display: project.property_type_display || project.property_type || 'Unknown',
          listing_type_display: project.listing_type_display || project.listing_type || 'Unknown',
          location: project.location || 'N/A',
          covered_size: project.covered_size || 'N/A'
        }));
        
        setProjects(formattedData);
        setFilteredProjects(formattedData);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        message.error('Failed to load development projects. Please try again.');
        console.error('Error fetching development projects:', error);
      }
    };

    fetchProjects();
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
    let results = [...projects];
    
    // Apply search
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      results = results.filter(project => 
        project.project_name?.toLowerCase().includes(lowercasedQuery) ||
        project.location?.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    // Apply filters for property type
    if (filters.propertyType?.length) {
      results = results.filter(project => 
        filters.propertyType.includes(project.property_type)
      );
    }
    
    // Apply filters for listing type
    if (filters.listingType?.length) {
      results = results.filter(project => 
        filters.listingType.includes(project.listing_type)
      );
    }
    
    setFilteredProjects(results);
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
            return item[col.field] || '';
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
        
        message.success(`Exported ${data.length} development projects as CSV`);
      } catch (error) {
        message.error('Failed to export data');
      }
    } else {
      message.info(`Export as ${format} is not implemented yet`);
    }
  };

  // Handle create new project
  const handleCreateProject = () => {
    navigate('/dashboard/real-estate/development-projects/create');
  };

  // Handle view project
  const handleViewProject = (project) => {
    navigate(`/dashboard/real-estate/development-projects/${project.id}`);
  };

  // Handle edit project
  const handleEditProject = (project) => {
    navigate(`/dashboard/real-estate/development-projects/${project.id}/edit`);
  };

  // Handle delete project
  const handleDeleteProject = async (project) => {
    try {
      // Show loading message
      message.loading('Deleting project...', 0);
      
      // Make the delete request
      await api.delete(API_ENDPOINTS.DEVELOPMENT_PROJECTS.DETAIL(project.id));
      
      // Hide loading message
      message.destroy();
      
      // Show success message
      message.success(`Project "${project.project_name}" deleted successfully`);
      
      // Update the projects list by removing the deleted project
      const updatedProjects = projects.filter(item => item.id !== project.id);
      setProjects(updatedProjects);
      setFilteredProjects(filteredProjects.filter(item => item.id !== project.id));
    } catch (error) {
      // Hide loading message
      message.destroy();
      
      // Show error message
      message.error('Failed to delete project. Please try again.');
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
                Development Projects
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <DownloadButton 
                  data={filteredProjects}
                  filename="development-projects"
                  onExport={handleExport}
                />
                <CreateButton 
                  onClick={handleCreateProject}
                  buttonText="Add new"
                />
              </Stack>
            </Box>
            
            {/* Search and Filter Row */}
            <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <SearchBar 
                  placeholder="Search project name or location..." 
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
              data={filteredProjects}
              loading={loading}
              onViewClick={handleViewProject}
              onEditClick={handleEditProject}
              onDeleteClick={handleDeleteProject}
              pagination={true}
              rowsPerPage={10}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              defaultSortField="project_name"
              defaultSortDirection="asc"
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DevelopmentProjectIndex;
