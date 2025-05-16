import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Grid, Paper, Button, 
  TextField, FormControl, InputLabel, Select, MenuItem,
  FormHelperText, CircularProgress, Divider, Chip, IconButton,
  List, ListItem, ListItemText, ListItemSecondaryAction, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { message } from 'antd';
import api, { branchService, departmentService, userService } from '../../services/api';

const CreateTeam = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tenantId, setTenantId] = useState(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    branch: '',
    department: '',
    department_head: ''
  });
  
  // Team structure state
  const [managers, setManagers] = useState([]);
  const [teamLeadsMap, setTeamLeadsMap] = useState({});  // Maps manager ID to array of team leads
  const [teamMembersMap, setTeamMembersMap] = useState({}); // Maps team lead ID to array of members
  
  // Form errors state
  const [errors, setErrors] = useState({});
  
  // Options for dropdowns
  const [branchOptions, setBranchOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [departmentHeadOptions, setDepartmentHeadOptions] = useState([]);
  const [managerOptions, setManagerOptions] = useState([]);
  const [teamLeadOptions, setTeamLeadOptions] = useState([]);
  const [memberOptions, setMemberOptions] = useState([]);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [dialogData, setDialogData] = useState({
    managerId: null,
    teamLeadId: null,
    selectedOption: ''
  });
  
  // Add this state for dialog search
  const [dialogSearch, setDialogSearch] = useState('');
  
  // Get current user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const tenantId = localStorage.getItem('tenant_id');
      setTenantId(tenantId);
      
      // If tenant ID is available, load options
      if (tenantId) {
        loadInitialOptions(tenantId);
      }
    } catch (error) {
      message.error('Error loading user data. Please log in again.');
      navigate('/login');
    }
  }, [navigate]);
  
  // Load initial form options (branches and departments)
  const loadInitialOptions = async (tenantId) => {
    setLoading(true);
    try {
      // Use the service functions that have built-in fallbacks
      try {
        const branchesData = await branchService.getBranches(tenantId);
        setBranchOptions(branchesData || []);
      } catch (branchError) {
        message.error('Failed to load branches. Please try again later.');
        setBranchOptions([]);
      }
      
      try {
        const departmentsData = await departmentService.getDepartments(tenantId);
        setDepartmentOptions(departmentsData || []);
      } catch (deptError) {
        message.error('Failed to load departments. Please try again later.');
        setDepartmentOptions([]);
      }
      
    } finally {
      setLoading(false);
    }
  };
  
  // Improved function to fetch all users with pagination handling
  const fetchAllUsers = async () => {
    try {
      // Get the tenant_id from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      
      if (!tenantId) {
        message.error('Tenant information not found. Please log in again.');
        navigate('/login');
        return [];
      }
      
      let allUsers = [];
      let nextPageUrl = null;
      let currentPage = 1;
      
      // Fetch first page
      const params = { 
        tenant: tenantId,
        page: 1,
        page_size: 100  // Request a large page size, but the API may override this
      };
      
      // Make the first request
      const firstResponse = await api.get('auth/users/', { params });
      
      // Process response data
      if (firstResponse.data?.results && Array.isArray(firstResponse.data.results)) {
        allUsers = [...firstResponse.data.results];
        
        // Check if there are more pages
        if (firstResponse.data.next) {
          nextPageUrl = firstResponse.data.next;
        }
      } else if (Array.isArray(firstResponse.data)) {
        allUsers = [...firstResponse.data];
      } else {
        return [];
      }
      
      // Fetch additional pages if needed
      while (nextPageUrl && currentPage < 10) { // Limit to 10 pages for safety
        currentPage++;
        
        try {
          // Extract the relative URL path from the full URL
          const urlParts = nextPageUrl.split('/api/');
          const relativeUrl = urlParts.length > 1 ? urlParts[1] : nextPageUrl;
          
          const pageResponse = await api.get(relativeUrl);
          
          if (pageResponse.data?.results && Array.isArray(pageResponse.data.results)) {
            const pageUsers = pageResponse.data.results;
            
            // Add these users to our collection
            allUsers = [...allUsers, ...pageUsers];
            
            // Update next page URL
            nextPageUrl = pageResponse.data.next;
          } else {
            nextPageUrl = null;
          }
        } catch (pageError) {
          nextPageUrl = null;
        }
      }
      
      return allUsers;
    } catch (error) {
      message.error('Failed to load users');
      return [];
    }
  };
  
  // Update useEffect to load user options
  useEffect(() => {
    const loadUserOptions = async () => {
      if (!tenantId) return;
      
      try {
        setLoading(true);
        
        // Get all users for the tenant
        const allUsers = await fetchAllUsers();
        
        // Set all users for both department heads and managers
        setDepartmentHeadOptions(allUsers);
        setManagerOptions(allUsers);
        
        setLoading(false);
      } catch (error) {
        setDepartmentHeadOptions([]);
        setManagerOptions([]);
        setLoading(false);
      }
    };
    
    loadUserOptions();
  }, [tenantId]); // Only depend on tenantId, not branch or department
  
  // Simplified load member options
  useEffect(() => {
    // Load all users regardless of branch or department selection
    if (tenantId) {
      fetchAllUsers().then(allUsers => {
        setMemberOptions(allUsers);
        setTeamLeadOptions(allUsers);
      }).catch(error => {
        // Silently handle error
      });
    }
  }, [tenantId]);
  
  // Updated dialog open handler
  const handleOpenDialog = (type, managerId = null, teamLeadId = null) => {
    setDialogType(type);
    setDialogData({
      managerId,
      teamLeadId,
      selectedOption: ''
    });
    setDialogOpen(true);
    
    // Show loading indicator in dialog
    setLoading(true);
    
    // Fetch all users for any dialog type
    fetchAllUsers().then(allUsers => {
      // Use the same users list for all dialog types
      switch(type) {
        case 'manager':
          setManagerOptions(allUsers);
          break;
        case 'teamLead':
          setTeamLeadOptions(allUsers);
          break;
        case 'member':
          setMemberOptions(allUsers);
          break;
        default:
          break;
      }
      setLoading(false);
    }).catch(error => {
      setLoading(false);
    });
    
    // Reset dialog search
    setDialogSearch('');
  };
  
  // Handle form input changes for basic team info
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Reset hierarchy if branch or department changes
    if (name === 'branch' || name === 'department') {
      setManagers([]);
      setTeamLeadsMap({});
      setTeamMembersMap({});
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Handle blur event for team name field to check for duplicates
  const handleTeamNameBlur = async () => {
    if (!formData.name || !formData.department || !formData.branch) return;
    
    const normalizedName = normalizeTeamName(formData.name);
    
    // Check for exact match
    const teamExists = await checkTeamExists(normalizedName, formData.department, formData.branch);
    
    if (teamExists) {
      setErrors({
        ...errors,
        name: 'A team with this name already exists in the selected department and branch'
      });
      return;
    }
    
    // Check for similar names
    const similarTeams = await checkSimilarTeamNames(normalizedName, formData.department, formData.branch);
    
    if (similarTeams.length > 0) {
      message.info(`Found ${similarTeams.length} team(s) with similar names in this department/branch.`);
    }
  };
  
  // Handle dialog option selection
  const handleDialogOptionChange = (e) => {
    setDialogData({
      ...dialogData,
      selectedOption: e.target.value
    });
  };
  
  // Add selected entity from dialog
  const handleAddFromDialog = () => {
    const { selectedOption, managerId, teamLeadId } = dialogData;
    
    if (!selectedOption) {
      message.error('Please select an option');
      return;
    }
    
    switch(dialogType) {
      case 'manager':
        // Add manager to the list
        const selectedManager = managerOptions.find(m => m.id === selectedOption);
        if (selectedManager && !managers.some(m => m.id === selectedOption)) {
          setManagers([...managers, selectedManager]);
          // Initialize empty team leads array for this manager
          setTeamLeadsMap(prev => ({
            ...prev,
            [selectedOption]: []
          }));
        }
        break;
      case 'teamLead':
        // Add team lead to the specified manager
        if (managerId) {
          const selectedTeamLead = teamLeadOptions.find(tl => tl.id === selectedOption);
          
          // Check if this team lead is already assigned to any manager
          let alreadyAssigned = false;
          Object.values(teamLeadsMap).forEach(teamLeads => {
            if (teamLeads.some(tl => tl.id === selectedOption)) {
              alreadyAssigned = true;
            }
          });
          
          if (selectedTeamLead && !alreadyAssigned) {
            setTeamLeadsMap(prev => ({
              ...prev,
              [managerId]: [...(prev[managerId] || []), selectedTeamLead]
            }));
            
            // Initialize empty members array for this team lead
            setTeamMembersMap(prev => ({
              ...prev,
              [selectedOption]: []
            }));
          } else if (alreadyAssigned) {
            message.warning('This team lead is already assigned to another manager');
          }
        }
        break;
      case 'member':
        // Add member to the specified team lead
        if (teamLeadId) {
          const selectedMember = memberOptions.find(m => m.id === selectedOption);
          
          // Check if this member is already assigned to any team lead
          let alreadyAssigned = false;
          Object.values(teamMembersMap).forEach(members => {
            if (members.some(m => m.id === selectedOption)) {
              alreadyAssigned = true;
            }
          });
          
          if (selectedMember && !alreadyAssigned) {
            setTeamMembersMap(prev => ({
              ...prev,
              [teamLeadId]: [...(prev[teamLeadId] || []), selectedMember]
            }));
          } else if (alreadyAssigned) {
            message.warning('This member is already assigned to another team lead');
          }
        }
        break;
      default:
        break;
    }
    
    // Close dialog
    setDialogOpen(false);
    setDialogData({ managerId: null, teamLeadId: null, selectedOption: '' });
  };
  
  // Remove manager and all associated team leads/members
  const handleRemoveManager = (managerId) => {
    // Get team leads under this manager
    const teamLeads = teamLeadsMap[managerId] || [];
    
    // Remove all members under team leads of this manager
    teamLeads.forEach(teamLead => {
      setTeamMembersMap(prev => {
        const newMap = { ...prev };
        delete newMap[teamLead.id];
        return newMap;
      });
    });
    
    // Remove team leads under this manager
    setTeamLeadsMap(prev => {
      const newMap = { ...prev };
      delete newMap[managerId];
      return newMap;
    });
    
    // Remove manager
    setManagers(managers.filter(m => m.id !== managerId));
  };
  
  // Remove team lead and all associated members
  const handleRemoveTeamLead = (managerId, teamLeadId) => {
    // Remove all members under this team lead
    setTeamMembersMap(prev => {
      const newMap = { ...prev };
      delete newMap[teamLeadId];
      return newMap;
    });
    
    // Remove team lead from manager
    setTeamLeadsMap(prev => ({
      ...prev,
      [managerId]: prev[managerId].filter(tl => tl.id !== teamLeadId)
    }));
  };
  
  // Remove member
  const handleRemoveMember = (teamLeadId, memberId) => {
    setTeamMembersMap(prev => ({
      ...prev,
      [teamLeadId]: prev[teamLeadId].filter(m => m.id !== memberId)
    }));
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    }
    
    if (!formData.branch) {
      newErrors.branch = 'Branch is required';
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    if (managers.length === 0) {
      newErrors.managers = 'At least one manager is required';
    } else {
      // Check if each manager has at least one team lead
      let managersWithoutTeamLeads = [];
      managers.forEach(manager => {
        if (!teamLeadsMap[manager.id] || teamLeadsMap[manager.id].length === 0) {
          managersWithoutTeamLeads.push(manager.email || `Manager ${manager.id}`);
        }
      });
      
      if (managersWithoutTeamLeads.length > 0) {
        newErrors.teamLeads = `The following managers have no team leads assigned: ${managersWithoutTeamLeads.join(', ')}`;
      }
      
      // Check if each team lead has at least one member
      let teamLeadsWithoutMembers = [];
      Object.entries(teamLeadsMap).forEach(([managerId, teamLeads]) => {
        teamLeads.forEach(teamLead => {
          if (!teamMembersMap[teamLead.id] || teamMembersMap[teamLead.id].length === 0) {
            teamLeadsWithoutMembers.push(teamLead.email || `Team Lead ${teamLead.id}`);
          }
        });
      });
      
      if (teamLeadsWithoutMembers.length > 0) {
        newErrors.members = `The following team leads have no members assigned: ${teamLeadsWithoutMembers.join(', ')}`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Helper function to normalize team name (trim and convert to title case)
  const normalizeTeamName = (name) => {
    if (!name) return '';
    
    // Trim and remove extra spaces
    const trimmed = name.trim().replace(/\s+/g, ' ');
    
    // Convert to title case (capitalize first letter of each word)
    return trimmed.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };
  
  // New function to check if a team with the same name already exists
  const checkTeamExists = async (teamName, departmentId, branchId) => {
    try {
      // Normalize the team name
      const normalizedName = normalizeTeamName(teamName);
      
      // Prepare params for filtering teams
      const params = {
        tenant: tenantId,
        department: departmentId,
        branch: branchId
      };
      
      // Try both endpoints
      const endpoints = ['teams/', 'auth/teams/'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint, { params });
          
          let teamsArray = [];
          if (Array.isArray(response.data)) {
            teamsArray = response.data;
          } else if (response.data?.results && Array.isArray(response.data.results)) {
            teamsArray = response.data.results;
          } else if (response.data && typeof response.data === 'object') {
            teamsArray = Object.values(response.data).filter(item => typeof item === 'object');
          }
          
          // Check if any team matches our criteria (case-insensitive name comparison)
          const existingTeam = teamsArray.find(team => 
            normalizeTeamName(team.name) === normalizedName && 
            team.department === departmentId &&
            team.branch === branchId &&
            team.tenant === tenantId
          );
          
          if (existingTeam) {
            return true;
          }
        } catch (error) {
          // Continue to next endpoint
        }
      }
      
      return false;
    } catch (error) {
      return false; // Assume no conflict if there's an error
    }
  };
  
  // Helper function to check for similar team names
  const checkSimilarTeamNames = async (teamName, departmentId, branchId) => {
    try {
      // Normalize the team name
      const normalizedName = normalizeTeamName(teamName).toLowerCase();
      
      // Prepare params for filtering teams
      const params = {
        tenant: tenantId,
        department: departmentId,
        branch: branchId
      };
      
      // Try both endpoints
      const endpoints = ['teams/', 'auth/teams/'];
      let allTeams = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint, { params });
          
          let teamsArray = [];
          if (Array.isArray(response.data)) {
            teamsArray = response.data;
          } else if (response.data?.results && Array.isArray(response.data.results)) {
            teamsArray = response.data.results;
          } else if (response.data && typeof response.data === 'object') {
            teamsArray = Object.values(response.data).filter(item => typeof item === 'object');
          }
          
          if (teamsArray.length > 0) {
            allTeams = teamsArray;
            break;
          }
        } catch (error) {
          // Continue to next endpoint
        }
      }
      
      // Find teams with similar names
      const similarTeams = allTeams.filter(team => {
        const teamNameLower = normalizeTeamName(team.name).toLowerCase();
        
        // Check if names are similar (contain each other or have Levenshtein distance < 3)
        return (
          teamNameLower.includes(normalizedName) || 
          normalizedName.includes(teamNameLower) ||
          levenshteinDistance(teamNameLower, normalizedName) < 3
        );
      });
      
      return similarTeams;
    } catch (error) {
      return []; // Return empty array if there's an error
    }
  };
  
  // Helper function to calculate Levenshtein distance between two strings
  const levenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix = [];
    
    // Initialize the matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      message.error('Please fix the errors in the form');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Normalize the team name
      const normalizedName = normalizeTeamName(formData.name);
      
      // Check if a team with the same name, department, branch, and tenant already exists
      const teamExists = await checkTeamExists(normalizedName, formData.department, formData.branch);
      
      if (teamExists) {
        setSubmitting(false);
        setErrors({
          name: 'A team with this name already exists in the selected department and branch'
        });
        message.error('A team with this name already exists in the selected department and branch');
        return;
      }
      
      // Check for similar team names and warn the user
      const similarTeams = await checkSimilarTeamNames(normalizedName, formData.department, formData.branch);
      
      if (similarTeams.length > 0) {
        // Show warning but don't block submission
        message.warning(`Found ${similarTeams.length} team(s) with similar names in this department/branch. Please verify this is not a duplicate.`);
      }
      
      // 1. Create the team
      const teamData = {
        name: normalizedName,
        description: formData.description,
        tenant: tenantId,
        department: formData.department,
        branch: formData.branch,
        department_head: formData.department_head || null
      };
      
      const teamResponse = await api.post('teams/', teamData);
      const teamId = teamResponse.data.id;
      
      // 2. Create team managers
      for (const manager of managers) {
        const managerData = {
          team: teamId,
          manager: manager.id
        };
        
        const managerResponse = await api.post('team-managers/', managerData);
        const teamManagerId = managerResponse.data.id;
        
        // 3. Create team leads for this manager
        const teamLeads = teamLeadsMap[manager.id] || [];
        for (const teamLead of teamLeads) {
          const teamLeadData = {
            team: teamId,
            manager: teamManagerId,
            team_lead: teamLead.id
          };
          
          const teamLeadResponse = await api.post('team-leads/', teamLeadData);
          const teamLeadId = teamLeadResponse.data.id;
          
          // 4. Create team members for this team lead
          const members = teamMembersMap[teamLead.id] || [];
          for (const member of members) {
            const memberData = {
              team: teamId,
              team_lead: teamLeadId,
              member: member.id
            };
            
            await api.post('team-members/', memberData);
          }
        }
      }
      
      setSubmitting(false);
      message.success('Team created successfully!');
      
      // Navigate back to the teams index page instead of team detail page
      navigate('/dashboard/teams');
    } catch (error) {
      setSubmitting(false);
      
      // Handle API validation errors more clearly
      if (error.response?.data) {
        const apiErrors = error.response.data;
        const formattedErrors = {};
        
        Object.keys(apiErrors).forEach(key => {
          formattedErrors[key] = Array.isArray(apiErrors[key]) 
            ? apiErrors[key][0] 
            : apiErrors[key];
        });
        
        setErrors(formattedErrors);
        message.error('Please correct the errors in the form: ' + 
          Object.values(formattedErrors).join(', '));
      } else {
        message.error('Failed to create team. Please try again.');
      }
    }
  };
  
  // Handle cancel/back
  const handleCancel = () => {
    navigate('/dashboard/teams');
  };
  
  // Format user display name
  const formatUserName = (user) => {
    if (!user) return 'Unknown';
    
    // Check if we have first/last name
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    // If we have a name, return it, otherwise try email
    if (fullName) {
      return fullName;
    } else if (user.email) {
      return user.email.split('@')[0]; // Just the username part of email
    }
    
    return `User ${user.id}`;
  };
  
  if (loading && !branchOptions.length && !departmentOptions.length) {
    return (
      <Container maxWidth="md" sx={{ pt: 4, pb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ pt: 2, pb: 4 }}>
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
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Button
                variant="text"
                color="inherit"
                startIcon={<ArrowBackIcon />}
                onClick={handleCancel}
                sx={{ mr: 2 }}
              >
                Back
              </Button>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
                Create New Team
              </Typography>
            </Box>
            
            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Basic Team Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Basic Team Information</Typography>
                  <Grid container spacing={2}>
                {/* Team Name */}
                    <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Team Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                    onBlur={handleTeamNameBlur}
                  />
                </Grid>
                
                {/* Description */}
                    <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    error={!!errors.description}
                    helperText={errors.description}
                  />
                </Grid>
                
                {/* Branch */}
                    <Grid item xs={12} md={4}>
                  <FormControl fullWidth error={!!errors.branch} required>
                    <InputLabel>Branch</InputLabel>
                    <Select
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      label="Branch"
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                            overflow: 'auto',
                          },
                        },
                      }}
                    >
                          {branchOptions.map(branch => (
                        <MenuItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.branch && <FormHelperText>{errors.branch}</FormHelperText>}
                  </FormControl>
                </Grid>
                
                {/* Department */}
                    <Grid item xs={12} md={4}>
                  <FormControl fullWidth error={!!errors.department} required>
                    <InputLabel>Department</InputLabel>
                    <Select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      label="Department"
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                            overflow: 'auto',
                          },
                        },
                      }}
                    >
                          {departmentOptions.map(department => (
                        <MenuItem key={department.id} value={department.id}>
                          {department.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.department && <FormHelperText>{errors.department}</FormHelperText>}
                  </FormControl>
                </Grid>
                
                    {/* Department Head */}
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth error={!!errors.department_head}>
                        <InputLabel>Department Head</InputLabel>
                        <Select
                          name="department_head"
                          value={formData.department_head}
                          onChange={handleInputChange}
                          label="Department Head"
                          disabled={loading}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 1000,  // Increased height to show more items
                                overflow: 'auto',
                              },
                            },
                            disableScrollLock: false,
                          }}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          
                          {loading ? (
                            <MenuItem disabled>
                              <Box display="flex" alignItems="center">
                                <CircularProgress size={20} sx={{ mr: 1 }} />
                                Loading...
                              </Box>
                            </MenuItem>
                          ) : departmentHeadOptions.length === 0 ? (
                            <MenuItem disabled>
                              <em>No users available</em>
                            </MenuItem>
                          ) : (
                            departmentHeadOptions.map(user => (
                              <MenuItem 
                                key={user.id} 
                                value={user.id}
                              >
                                {formatUserName(user)} 
                                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                  ({user.email})
                                  {user.role && ` - ${user.role}`}
                                </Typography>
                              </MenuItem>
                            ))
                          )}
                        </Select>
                        
                        {errors.department_head && (
                          <FormHelperText>{errors.department_head}</FormHelperText>
                        )}
                        
                        {departmentHeadOptions.length === 0 && !loading && (
                          <FormHelperText>
                            No users found for this tenant.
                          </FormHelperText>
                        )}
                        
                        {/* Show count of available options */}
                        {departmentHeadOptions.length > 0 && (
                          <FormHelperText>
                            {departmentHeadOptions.length} users available
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* Team Hierarchy Section */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Team Hierarchy</Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenDialog('manager')}
                      disabled={!formData.branch || !formData.department}
                    >
                      Add Manager
                    </Button>
                  </Box>
                  
                  {!formData.branch || !formData.department ? (
                    <Typography color="text.secondary">
                      Please select branch and department first to set up team hierarchy
                    </Typography>
                  ) : errors.managers ? (
                    <Typography color="error">{errors.managers}</Typography>
                  ) : (
                    <Box sx={{ mb: 3 }}>
                      {managers.length === 0 ? (
                        <Typography color="text.secondary">
                          No managers added yet. Click "Add Manager" to begin building your team hierarchy.
                        </Typography>
                      ) : (
                        managers.map(manager => (
                          <Card key={manager.id} variant="outlined" sx={{ mb: 2 }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" color="primary">
                                  {formatUserName(manager)} (Manager)
                                </Typography>
                                <Box>
                                  <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleOpenDialog('teamLead', manager.id)}
                                    sx={{ mr: 1 }}
                                  >
                                    Add Team Lead
                                  </Button>
                                  <IconButton 
                                    color="error" 
                                    onClick={() => handleRemoveManager(manager.id)}
                                    size="small"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </Box>
                              
                              {/* Team Leads under this manager */}
                              <Box sx={{ ml: 3 }}>
                                {!teamLeadsMap[manager.id] || teamLeadsMap[manager.id].length === 0 ? (
                                  <Typography color="text.secondary" variant="body2">
                                    No team leads assigned to this manager yet.
                                  </Typography>
                                ) : (
                                  teamLeadsMap[manager.id].map(teamLead => (
                                    <Card key={teamLead.id} variant="outlined" sx={{ mb: 1, mt: 1 }}>
                                      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <Typography variant="subtitle1">
                                            {formatUserName(teamLead)} (Team Lead)
                                          </Typography>
                                          <Box>
                                            <Button
                                              size="small"
                                              startIcon={<PersonAddIcon />}
                                              onClick={() => handleOpenDialog('member', null, teamLead.id)}
                                              sx={{ mr: 1 }}
                                            >
                                              Add Member
                                            </Button>
                                            <IconButton 
                                              color="error" 
                                              onClick={() => handleRemoveTeamLead(manager.id, teamLead.id)}
                                              size="small"
                                            >
                                              <DeleteIcon />
                                            </IconButton>
                                          </Box>
                                        </Box>
                                        
                                        {/* Members under this team lead */}
                                        <Box sx={{ ml: 3, mt: 1 }}>
                                          {!teamMembersMap[teamLead.id] || teamMembersMap[teamLead.id].length === 0 ? (
                                            <Typography color="text.secondary" variant="body2">
                                              No members assigned to this team lead yet.
                                            </Typography>
                                          ) : (
                                            <Grid container spacing={1}>
                                              {teamMembersMap[teamLead.id].map(member => (
                                                <Grid item key={member.id}>
                                                  <Chip
                                                    label={formatUserName(member)}
                                                    onDelete={() => handleRemoveMember(teamLead.id, member.id)}
                                                    size="small"
                                                  />
                                                </Grid>
                                              ))}
                                            </Grid>
                                          )}
                                        </Box>
                                      </CardContent>
                                    </Card>
                                  ))
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </Box>
                  )}
                  
                  {errors.teamLeads && (
                    <Typography color="error" sx={{ mb: 2 }}>
                      {errors.teamLeads}
                    </Typography>
                  )}
                  
                  {errors.members && (
                    <Typography color="error" sx={{ mb: 2 }}>
                      {errors.members}
                    </Typography>
                  )}
                </Grid>
                
                {/* Submit Buttons */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={handleCancel}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      disabled={submitting}
                    >
                      {submitting ? 'Creating Team...' : 'Create Team'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Dialog for adding managers, team leads, or members */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'manager' ? 'Add Manager' : 
           dialogType === 'teamLead' ? 'Add Team Lead' : 'Add Team Member'}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={3}>
              <CircularProgress size={30} />
              <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
                Loading users...
              </Typography>
            </Box>
          ) : (
            <FormControl fullWidth>
              <InputLabel>
                {dialogType === 'manager' ? 'Select Manager' : 
                 dialogType === 'teamLead' ? 'Select Team Lead' : 'Select Member'}
              </InputLabel>
              <Select
                value={dialogData.selectedOption}
                onChange={handleDialogOptionChange}
                label={dialogType === 'manager' ? 'Select Manager' : 
                       dialogType === 'teamLead' ? 'Select Team Lead' : 'Select Member'}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 400,
                      overflow: 'auto',
                    },
                  },
                  disableScrollLock: false,
                }}
              >
                {/* Manager options */}
                {dialogType === 'manager' && managerOptions.length === 0 ? (
                  <MenuItem disabled>No managers available</MenuItem>
                ) : dialogType === 'manager' && (
                  managerOptions.map(option => (
                    <MenuItem 
                      key={option.id} 
                      value={option.id}
                      disabled={managers.some(m => m.id === option.id)}
                    >
                      {formatUserName(option)} {option.department?.name && `(${option.department.name})`}
                    </MenuItem>
                  ))
                )}
                
                {/* Team lead options */}
                {dialogType === 'teamLead' && teamLeadOptions.length === 0 ? (
                  <MenuItem disabled>No team leads available</MenuItem>
                ) : dialogType === 'teamLead' && (
                  teamLeadOptions.map(option => (
                    <MenuItem 
                      key={option.id} 
                      value={option.id}
                      disabled={Object.values(teamLeadsMap).some(
                        teamLeads => teamLeads.some(tl => tl.id === option.id)
                      )}
                    >
                      {formatUserName(option)} {option.department?.name && `(${option.department.name})`}
                    </MenuItem>
                  ))
                )}
                
                {/* Member options */}
                {dialogType === 'member' && memberOptions.length === 0 ? (
                  <MenuItem disabled>No members available</MenuItem>
                ) : dialogType === 'member' && (
                  memberOptions.map(option => (
                    <MenuItem 
                      key={option.id} 
                      value={option.id}
                      disabled={Object.values(teamMembersMap).some(
                        members => members.some(m => m.id === option.id)
                      )}
                    >
                      {formatUserName(option)} {option.role && `(${option.role})`}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddFromDialog} 
            variant="contained" 
            color="primary"
            disabled={!dialogData.selectedOption || loading}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreateTeam; 