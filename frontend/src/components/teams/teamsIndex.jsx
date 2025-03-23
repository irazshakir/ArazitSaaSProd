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
      
      console.log('User data loaded:', { userData, userRole, tenantId });
    } catch (error) {
      console.error('Error parsing user data:', error);
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
      width: '25%',
      minWidth: 180,
      sortable: true 
    },
    { 
      field: 'department_name', 
      headerName: 'DEPARTMENT', 
      width: '15%',
      minWidth: 150,
      sortable: true
    },
    { 
      field: 'branch_name', 
      headerName: 'BRANCH', 
      width: '15%',
      minWidth: 150,
      sortable: true
    },
    { 
      field: 'team_lead_display', 
      headerName: 'TEAM LEAD', 
      width: '20%',
      minWidth: 180,
      sortable: true,
      render: (value, row) => (
        value && value !== 'Not Assigned' ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar 
              src={row.team_lead_details?.profile_picture} 
              alt={value} 
              sx={{ width: 30, height: 30 }}
            >
              {value.charAt(0)}
            </Avatar>
            <Typography variant="body2">{value}</Typography>
          </Box>
        ) : 'Not Assigned'
      )
    },
    { 
      field: 'member_count', 
      headerName: 'MEMBERS', 
      width: '15%',
      minWidth: 120,
      sortable: true,
      render: (value, row) => (
        <Chip 
          label={value || '0'} 
          color="primary" 
          size="small"
          variant="outlined"
          sx={{ 
            minWidth: '40px', 
            justifyContent: 'center',
            fontWeight: 'bold'
          }} 
        />
      )
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

  // Add this debugging function
  const debugApiResponse = (response) => {
    console.group('API Response Debugging');
    console.log('Raw response:', response);
    
    // Check for different ways the data might be structured
    if (Array.isArray(response.data)) {
      console.log('Data is an array with length:', response.data.length);
    } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
      console.log('Data has results array with length:', response.data.results.length);
    } else if (response.data) {
      console.log('Data structure:', Object.keys(response.data));
      if (typeof response.data === 'object') {
        console.log('Data object entries:', Object.entries(response.data).slice(0, 3)); // Show first 3 entries
      }
    }
    
    // Check for status code
    console.log('Response status:', response.status);
    console.groupEnd();
  };

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
          console.log('Admin role: Fetching all teams for tenant', tenantId);
          break;
        case 'department_head':
          // Department head sees all teams in their department
          if (user.department) {
            params.department = user.department;
            console.log('Department Head role: Fetching teams for department', user.department, user.department_name);
          } else {
            console.log('Department Head with no department: Fetching all teams for tenant', tenantId);
          }
          break;
        case 'manager':
          // Manager sees all teams they manage and teams in their department
          if (user.department) {
            params.department = user.department;
            console.log('Manager role: Fetching teams for department', user.department, user.department_name);
          } else {
            console.log('Manager with no department: Fetching all teams for tenant', tenantId);
          }
          break;
        case 'team_lead':
          // Team lead sees teams they lead
          params.team_lead = user.id;
          console.log('Team Lead role: Fetching teams for team lead', user.id);
          break;
        default:
          // Other roles see teams they're part of
          params.member = user.id;
          console.log('Agent role: Fetching teams for member', user.id);
          break;
      }
      
      console.log('API request parameters:', params);
      console.log('Sending request to endpoint:', endpoint);
      
      const response = await api.get(endpoint, { 
        params: { 
          ...params,
          include_related: true,
        }
      });
      
      // Use our debugging function
      debugApiResponse(response);
      
      // Process response data
      let teamsArray = [];
      
      if (Array.isArray(response.data)) {
        teamsArray = response.data;
        console.log('Data is directly an array');
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        teamsArray = response.data.results;
        console.log('Data is in results property');
      } else if (response.data && typeof response.data === 'object') {
        // Try to extract from object
        console.log('Trying to extract teams from object');
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          teamsArray = possibleArrays[0];
          console.log('Found possible teams array with length:', teamsArray.length);
        } else {
          // Last resort: treat the object itself as an array of teams
          teamsArray = Object.values(response.data);
          console.log('Using object values as teams array');
        }
      }
      
      console.log(`Found ${teamsArray.length} teams:`, teamsArray.slice(0, 2)); // Show first 2 teams
      
      if (teamsArray.length === 0) {
        console.warn('No teams found in the response');
        message.info('No teams found. Try creating a new team.');
      }
      
      // More detailed debugging for team structure
      if (teamsArray.length > 0) {
        console.group('Team Structure Debug');
        const sampleTeam = teamsArray[0];
        console.log('Team ID:', sampleTeam.id);
        console.log('Team Name:', sampleTeam.name);
        
        console.log('Department:', sampleTeam.department);
        if (typeof sampleTeam.department === 'object') {
          console.log('Department Structure:', Object.keys(sampleTeam.department));
        }
        
        console.log('Branch:', sampleTeam.branch);
        if (typeof sampleTeam.branch === 'object') {
          console.log('Branch Structure:', Object.keys(sampleTeam.branch));
        }
        
        console.log('Team Lead Details:', sampleTeam.team_lead_details);
        console.log('Team Leads Array:', sampleTeam.team_leads);
        console.log('Members Array:', sampleTeam.members);
        console.groupEnd();
      }
      
      // Create a separate function to format the data for display
      const formattedData = formatTeamsForDisplay(teamsArray);
      
      setTeams(formattedData);
      setFilteredTeams(formattedData);
      
      // Also fetch branches for filter options
      fetchBranches();
      
    } catch (error) {
      console.error('Error fetching teams:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Response headers:', error.response?.headers);
      message.error('Failed to load teams. Please try again.');
    }
  };
  
  // Separate function to format teams for display
  const formatTeamsForDisplay = (teamsArray) => {
    return teamsArray.map(team => {
      // Helper function to convert department/branch IDs to names
      const getDepartmentName = () => {
        if (!team.department) return 'Unknown';
        
        // If department is an object with name property
        if (typeof team.department === 'object' && team.department.name) {
          return team.department.name;
        }
        
        // If department is a string ID, try to use the department's name directly
        // This is important to show the name instead of ID
        return 'Department';
      };
      
      const getBranchName = () => {
        if (!team.branch) return 'Unknown';
        
        // If branch is an object with name property
        if (typeof team.branch === 'object' && team.branch.name) {
          return team.branch.name;
        }
        
        // If branch is a string ID, try to use the branch's name directly
        return 'Branch';
      };
      
      // Format team lead display name
      const formatTeamLeadDisplay = () => {
        if (team.team_lead_details) {
          return `${team.team_lead_details.first_name || ''} ${team.team_lead_details.last_name || ''}`.trim();
        }
        
        // Try to find team lead in the team structure
        if (team.team_leads && team.team_leads.length > 0) {
          const lead = team.team_leads[0];
          return lead.team_lead?.first_name ? 
            `${lead.team_lead.first_name || ''} ${lead.team_lead.last_name || ''}`.trim() :
            lead.team_lead?.email || 'Not Assigned';
        }
        
        return 'Not Assigned';
      };
      
      // Count members in the team
      const countMembers = () => {
        if (Array.isArray(team.members)) {
          return team.members.length;
        }
        
        // Try to count members in team structure if available
        let count = 0;
        if (team.team_leads) {
          team.team_leads.forEach(tl => {
            if (tl.team_members && Array.isArray(tl.team_members)) {
              count += tl.team_members.length;
            }
          });
        }
        
        return count;
      };
      
      // Return a formatted team object for display
      return {
        ...team,
        id: team.id,
        department_name: getDepartmentName(),
        branch_name: getBranchName(),
        team_lead_display: formatTeamLeadDisplay(),
        member_count: countMembers()
      };
    });
  };

  // Function to refresh teams (after fetchTeams is defined)
  const refreshTeams = async () => {
    try {
      setLoading(true);
      await fetchTeams();
      setLoading(false);
    } catch (error) {
      console.error('Error refreshing teams:', error);
      setLoading(false);
    }
  };

  // Update the fetchBranches function with the correct endpoint path
  const fetchBranches = async () => {
    try {
      const response = await api.get('branches/', { params: { tenant: tenantId } });
      
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
      console.error('Error fetching branches:', error);
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
        team.branch_name?.toLowerCase().includes(lowercasedQuery) ||
        team.team_lead_display?.toLowerCase().includes(lowercasedQuery)
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
    navigate(`/dashboard/teams/${team.id}`);
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