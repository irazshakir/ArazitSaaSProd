import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Stack, Grid, Paper, Chip, Avatar, AvatarGroup } from '@mui/material';
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

const TeamsIndex = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
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
    } catch (error) {
      message.error('Error loading user data. Please log in again.');
      navigate('/login');
    }
  }, [navigate]);

  // Initial fetch on component mount
  useEffect(() => {
    if (tenantId) {
      refreshTeams();
    }
  }, [tenantId]);

  // Add this effect to refresh when navigating to the page
  useEffect(() => {
    if (user && userRole && tenantId) {
      refreshTeams();
    }
  }, [location.pathname]);

  // Initial filter options
  const initialFilterOptions = [
    {
      name: 'department',
      label: 'Department',
      options: [
        { value: 'sales', label: 'Sales' },
        { value: 'support', label: 'Support' },
        { value: 'processing', label: 'Processing' },
        { value: 'finance', label: 'Finance' },
        { value: 'administration', label: 'Administration' },
      ]
    },
    {
      name: 'branch',
      label: 'Branch',
      options: []  // Will be populated from API
    }
  ];

  // State for filter options
  const [filterOptions, setFilterOptions] = useState(initialFilterOptions);

  // Define table columns
  const columns = [
    { 
      field: 'name', 
      headerName: 'TEAM NAME', 
      width: '40%',
      minWidth: 200,
      sortable: true 
    },
    { 
      field: 'department_name', 
      headerName: 'DEPARTMENT', 
      width: '25%',
      minWidth: 150,
      sortable: true
    },
    { 
      field: 'branch_name', 
      headerName: 'BRANCH', 
      width: '25%',
      minWidth: 150,
      sortable: true
    },
    { 
      field: 'created_at', 
      headerName: 'CREATED', 
      width: '10%',
      minWidth: 100,
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

  // Define fetchTeams with the correct API endpoint path (without double /api/)
  const fetchTeams = async () => {
    try {
      // Determine endpoint and parameters based on user role
      let endpoint = 'teams/';  // Remove /api/ prefix since it might be added elsewhere
      const params = { tenant: tenantId };
      
      // Role-based API calls
      switch(userRole) {
        case 'admin':
          // Admin sees all teams for the tenant
          break;
        case 'department_head':
          // Department head sees all teams in their department
          if (user.department) {
            params.department = user.department;
          }
          break;
        case 'manager':
          // Manager sees all teams they manage and teams in their department
          if (user.department) {
            params.department = user.department;
          }
          break;
        case 'team_lead':
          // Team lead sees teams they lead
          params.team_lead = user.id;
          break;
        default:
          // Other roles see teams they're part of
          params.member = user.id;
          break;
      }
      
      const response = await api.get(endpoint, { 
        params: { 
          ...params,
          include_related: true,
        }
      });
      
      // Process response data
      let teamsArray = [];
      
      if (Array.isArray(response.data)) {
        teamsArray = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        teamsArray = response.data.results;
      } else if (response.data && typeof response.data === 'object') {
        // Try to extract from object
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          teamsArray = possibleArrays[0];
        } else {
          // Last resort: treat the object itself as an array of teams
          teamsArray = Object.values(response.data);
        }
      }
      
      if (teamsArray.length === 0) {
        message.info('No teams found. Try creating a new team.');
      }
      
      // First set the basic formatted data
      const formattedData = formatTeamsForDisplay(teamsArray);
      setTeams(formattedData);
      setFilteredTeams(formattedData);
      
      // Then fetch and apply department and branch details in a separate call
      // This happens after the teams are loaded so it won't block the initial display
      fetchDepartmentAndBranchDetails(teamsArray);
      
    } catch (error) {
      message.error('Failed to load teams. Please try again.');
    }
  };
  
  // Separate function to format teams for display
  const formatTeamsForDisplay = (teamsArray) => {
    return teamsArray.map(team => {
      // Improved helper function to get department name
      const getDepartmentName = () => {
        if (!team.department) return 'Unknown';
        
        // If department is an object with name property
        if (typeof team.department === 'object' && team.department.name) {
          return team.department.name;
        }
        
        // Try to fetch from API separately - we'll implement this later
        // For now, customize this based on what's in your data
        if (typeof team.department === 'string') {
          // If we have department lookup data available from fetchDepartments
          const departmentId = team.department;
          
          // Instead of returning a generic "Department" placeholder, use the ID with a note
          return `${departmentId.substring(0, 8)}...`;
        }
        
        return 'Unknown Department';
      };
      
      // Improved helper function to get branch name
      const getBranchName = () => {
        if (!team.branch) return 'Unknown';
        
        // If branch is an object with name property
        if (typeof team.branch === 'object' && team.branch.name) {
          return team.branch.name;
        }
        
        // Try to fetch from API separately - we'll implement this later
        // For now, customize this based on what's in your data
        if (typeof team.branch === 'string') {
          // If we have branch lookup data available from fetchBranches
          const branchId = team.branch;
          
          // Instead of returning a generic "Branch" placeholder, use the ID with a note
          return `${branchId.substring(0, 8)}...`;
        }
        
        return 'Unknown Branch';
      };
      
      // Return a formatted team object for display
      return {
        ...team,
        id: team.id,
        department_name: getDepartmentName(),
        branch_name: getBranchName(),
        // We're removing these from the table but keeping them in the data in case needed elsewhere
        team_lead_display: 'Not Shown',
        member_count: 0
      };
    });
  };

  // Function to refresh teams
  const refreshTeams = async () => {
    try {
      // Fetch branches and departments first (to fill the filter options)
      await fetchBranches();
      
      // Then fetch teams
      await fetchTeams();
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  // Update the fetchBranches function with the correct endpoint path
  const fetchBranches = async () => {
    try {
      // Try the correct endpoint based on the logs and your router config
      const response = await api.get('/api/branches/', { params: { tenant: tenantId } });
      
      if (response.data && (Array.isArray(response.data) || Array.isArray(response.data.results))) {
        const branchesArray = Array.isArray(response.data) ? response.data : response.data.results;
        
        // Update filter options with branches
        const branchOptions = branchesArray.map(branch => ({
          value: branch.id,
          label: branch.name
        }));
        
        setFilterOptions(prev => {
          const updatedOptions = [...prev];
          const branchFilterIndex = updatedOptions.findIndex(f => f.name === 'branch');
          
          if (branchFilterIndex >= 0) {
            updatedOptions[branchFilterIndex].options = branchOptions;
          }
          
          return updatedOptions;
        });
      }
    } catch (error) {
      // Fallback to alternative endpoint if the first one fails
      try {
        const response = await api.get('/branches/', { params: { tenant: tenantId } });
        
        if (response.data && (Array.isArray(response.data) || Array.isArray(response.data.results))) {
          const branchesArray = Array.isArray(response.data) ? response.data : response.data.results;
          
          // Update filter options with branches
          const branchOptions = branchesArray.map(branch => ({
            value: branch.id,
            label: branch.name
          }));
          
          setFilterOptions(prev => {
            const updatedOptions = [...prev];
            const branchFilterIndex = updatedOptions.findIndex(f => f.name === 'branch');
            
            if (branchFilterIndex >= 0) {
              updatedOptions[branchFilterIndex].options = branchOptions;
            }
            
            return updatedOptions;
          });
        }
      } catch (fallbackError) {
      }
    }
  };

  // Add a separate function to fetch department details
  const fetchDepartments = async () => {
    try {
      // Try the correct endpoint based on the logs and your router config
      const response = await api.get('/api/departments/', { params: { tenant: tenantId } });
      
      if (response.data && (Array.isArray(response.data) || Array.isArray(response.data.results))) {
        const departmentsArray = Array.isArray(response.data) ? response.data : response.data.results;
        
        // Store the departments for reference
        return departmentsArray;
      }
      
      // If no data returned, try fallback endpoint
      const fallbackResponse = await api.get('/departments/', { params: { tenant: tenantId } });
      
      if (fallbackResponse.data && (Array.isArray(fallbackResponse.data) || Array.isArray(fallbackResponse.data.results))) {
        const departmentsArray = Array.isArray(fallbackResponse.data) ? 
          fallbackResponse.data : fallbackResponse.data.results;
        return departmentsArray;
      }
      
      return [];
    } catch (error) {
      // Try fallback endpoint
      try {
        const fallbackResponse = await api.get('/departments/', { params: { tenant: tenantId } });
        
        if (fallbackResponse.data && (Array.isArray(fallbackResponse.data) || Array.isArray(fallbackResponse.data.results))) {
          const departmentsArray = Array.isArray(fallbackResponse.data) ? 
            fallbackResponse.data : fallbackResponse.data.results;
          return departmentsArray;
        }
      } catch (fallbackError) {
      }
      return [];
    }
  };

  // Modify the fetchDepartmentAndBranchDetails function to use the updated endpoints
  const fetchDepartmentAndBranchDetails = async (teamsArray) => {
    try {
      // Extract all unique department and branch IDs
      const departmentIds = [...new Set(teamsArray.map(team => 
        typeof team.department === 'string' ? team.department : 
        (team.department?.id || null)).filter(Boolean))];
      
      const branchIds = [...new Set(teamsArray.map(team => 
        typeof team.branch === 'string' ? team.branch : 
        (team.branch?.id || null)).filter(Boolean))];
      
      // Create maps to store the name lookups
      const departmentMap = {};
      const branchMap = {};
      
      // Fetch departments using the correct endpoint
      try {
        const departmentsData = await fetchDepartments();
        
        // Create lookup map of ID -> name
        departmentsData.forEach(dept => {
          departmentMap[dept.id] = dept.name;
        });
      } catch (error) {
      }
      
      // Fetch branches using our updated function
      try {
        const response = await api.get('/api/branches/', { 
          params: { tenant: tenantId }
        });
        
        let branchesData = [];
        if (Array.isArray(response.data)) {
          branchesData = response.data;
        } else if (response.data?.results) {
          branchesData = response.data.results;
        }
        
        // Create lookup map of ID -> name
        branchesData.forEach(branch => {
          branchMap[branch.id] = branch.name;
        });
      } catch (error) {
        // Try fallback endpoint
        try {
          const fallbackResponse = await api.get('/branches/', { 
            params: { tenant: tenantId }
          });
          
          let branchesData = [];
          if (Array.isArray(fallbackResponse.data)) {
            branchesData = fallbackResponse.data;
          } else if (fallbackResponse.data?.results) {
            branchesData = fallbackResponse.data.results;
          }
          
          // Create lookup map of ID -> name
          branchesData.forEach(branch => {
            branchMap[branch.id] = branch.name;
          });
        } catch (fallbackError) {
        }
      }
      
      // Now update the teams with the proper names
      const updatedTeams = teamsArray.map(team => {
        // For department
        let departmentName = 'Unknown';
        if (team.department) {
          // First, check if department is an object with name
          if (typeof team.department === 'object' && team.department.name) {
            departmentName = team.department.name;
          } 
          // If it's a string (ID), look it up in our map
          else if (typeof team.department === 'string') {
            const deptId = team.department;
            if (departmentMap[deptId]) {
              departmentName = departmentMap[deptId];
            } else {
              // If not found in the map, show a shortened ID
              departmentName = `ID: ${deptId.substring(0, 8)}...`;
            }
          }
        }
        
        // For branch
        let branchName = 'Unknown';
        if (team.branch) {
          // First, check if branch is an object with name
          if (typeof team.branch === 'object' && team.branch.name) {
            branchName = team.branch.name;
          } 
          // If it's a string (ID), look it up in our map
          else if (typeof team.branch === 'string') {
            const branchId = team.branch;
            if (branchMap[branchId]) {
              branchName = branchMap[branchId];
            } else {
              // If not found in the map, show a shortened ID
              branchName = `ID: ${branchId.substring(0, 8)}...`;
            }
          }
        }
        
        return {
          ...team,
          department_name: departmentName,
          branch_name: branchName
        };
      });
      
      // Update the state with the new data
      setTeams(updatedTeams);
      setFilteredTeams(updatedTeams);
      
    } catch (error) {
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
    let results = [...teams];
    
    // Apply search
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      results = results.filter(team => 
        team.name?.toLowerCase().includes(lowercasedQuery) ||
        team.department_name?.toLowerCase().includes(lowercasedQuery) ||
        team.branch_name?.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    // Apply department filter
    if (filters.department?.length) {
      results = results.filter(team => 
        team.department && filters.department.includes(team.department.name?.toLowerCase())
      );
    }
    
    // Apply branch filter
    if (filters.branch?.length) {
      results = results.filter(team => 
        filters.branch.includes(team.branch?.id)
      );
    }
    
    setFilteredTeams(results);
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
            // Handle members field specially
            if (col.field === 'member_count') {
              return value.toString();
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
        
        message.success(`Exported ${data.length} teams as CSV`);
      } catch (error) {
        message.error('Failed to export data');
      }
    } else {
      message.info(`Export as ${format} is not implemented yet`);
    }
  };

  // Handle create new team
  const handleCreateTeam = () => {
    navigate('/dashboard/teams/create');
  };

  // Handle view team
  const handleViewTeam = (team) => {
    // Navigate to edit page instead of detail page
    navigate(`/dashboard/teams/${team.id}/edit`);
  };

  // Handle edit team
  const handleEditTeam = (team) => {
    navigate(`/dashboard/teams/${team.id}/edit`);
  };

  // Handle delete team - make sure this uses the correct endpoint format too
  const handleDeleteTeam = async (team) => {
    try {
      // Show loading message
      message.loading('Deleting team...', 0);
      
      // Make the delete request
      await api.delete(`teams/${team.id}/`);
      
      // Hide loading message
      message.destroy();
      
      // Show success message
      message.success(`Team "${team.name}" deleted successfully`);
      
      // Update the teams list by removing the deleted team
      const updatedTeams = teams.filter(item => item.id !== team.id);
      setTeams(updatedTeams);
      setFilteredTeams(filteredTeams.filter(item => item.id !== team.id));
    } catch (error) {
      // Hide loading message
      message.destroy();
      
      // Show error message
      message.error('Failed to delete team. Please try again.');
    }
  };

  // Get page title based on user role
  const getPageTitle = () => {
    if (!userRole) return 'Teams';
    
    switch(userRole) {
      case 'admin':
        return 'All Teams';
      case 'department_head':
        return `Department Teams`;
      case 'manager':
        return `Department Teams`;
      case 'team_lead':
        return 'My Teams';
      default:
        return 'My Teams';
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
                  data={filteredTeams}
                  filename="teams"
                  onExport={handleExport}
                />
                <CreateButton 
                  onClick={handleCreateTeam}
                  buttonText="Create Team"
                  icon="group_add"
                />
              </Stack>
            </Box>
            
            {/* Search and Filter Row */}
            <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <SearchBar 
                  placeholder="Search teams by name, department, branch..." 
                  onSearch={handleSearch}
                />
              </Box>
              <FilterButton 
                filters={filterOptions}
                onFilterChange={handleFilterChange}
              />
            </Box>
            
            {/* Show skeleton while loading */}
            {loading ? (
              <TableSkeleton columns={columns.length} rows={5} />
            ) : (
              /* Data Table */
              <TableList
                columns={columns}
                data={filteredTeams}
                loading={false}
                onRowClick={handleViewTeam}
                onEditClick={handleEditTeam}
                onDeleteClick={handleDeleteTeam}
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

export default TeamsIndex; 