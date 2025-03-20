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
        value ? (
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
      field: 'members', 
      headerName: 'MEMBERS', 
      width: '15%',
      minWidth: 120,
      sortable: false,
      render: (value, row) => (
        <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem' } }}>
          {Array.isArray(value) && value.map((member, index) => (
            <Avatar 
              key={index} 
              src={member.user?.profile_picture} 
              alt={member.user?.first_name}
              sx={{ width: 28, height: 28 }}
            >
              {member.user?.first_name ? member.user.first_name.charAt(0) : '?'}
            </Avatar>
          ))}
        </AvatarGroup>
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

  // Define fetchTeams before it's used in refreshTeams
  const fetchTeams = async () => {
    try {
      // Determine endpoint and parameters based on user role
      let endpoint = 'teams/';
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
      const response = await api.get(endpoint, { params });
      
      console.log('API response:', response);
      
      // Process response data
      let teamsArray = Array.isArray(response.data) 
        ? response.data
        : (response.data?.results && Array.isArray(response.data.results))
          ? response.data.results
          : [];
      
      console.log(`Fetched ${teamsArray.length} teams:`, teamsArray);
      
      // Transform data for UI representation
      const formattedData = teamsArray.map(team => ({
        ...team,
        id: team.id,
        department_name: team.department?.name || 'Unknown',
        branch_name: team.branch?.name || 'Unknown',
        team_lead_display: team.team_lead_details ? 
          `${team.team_lead_details.first_name || ''} ${team.team_lead_details.last_name || ''}`.trim() : 
          null
      }));
      
      console.log('Formatted teams data:', formattedData);
      
      setTeams(formattedData);
      setFilteredTeams(formattedData);
      
      // Also fetch branches for filter options
      fetchBranches();
      
    } catch (error) {
      console.error('Error fetching teams:', error);
      console.error('Error details:', error.response?.data);
      message.error('Failed to load teams. Please try again.');
    }
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

  // Fetch branches for filter
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
            if (col.field === 'members') {
              return Array.isArray(value) ? value.length.toString() : '0';
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

  // Handle delete team
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
            
            {/* Data Table */}
            <TableList
              columns={columns}
              data={filteredTeams}
              loading={loading}
              onRowClick={handleViewTeam}
              onEditClick={handleEditTeam}
              onDeleteClick={handleDeleteTeam}
              pagination={true}
              rowsPerPage={10}
              defaultSortField="created_at"
              defaultSortDirection="desc"
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TeamsIndex; 