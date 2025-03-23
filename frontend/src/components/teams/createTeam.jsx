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
      console.error('Error loading user data:', error);
      message.error('Error loading user data. Please log in again.');
      navigate('/login');
    }
  }, [navigate]);
  
  // Load initial form options (branches and departments)
  const loadInitialOptions = async (tenantId) => {
    setLoading(true);
    try {
      console.log('Fetching data for tenant ID:', tenantId);
      
      // Use the service functions that have built-in fallbacks
      try {
        console.log('Fetching branches using branchService...');
        const branchesData = await branchService.getBranches(tenantId);
        console.log('Branches data received:', branchesData);
        setBranchOptions(branchesData || []);
      } catch (branchError) {
        console.error('Error fetching branches:', branchError);
        message.error('Failed to load branches. Please try again later.');
        setBranchOptions([]);
      }
      
      try {
        console.log('Fetching departments using departmentService...');
        const departmentsData = await departmentService.getDepartments(tenantId);
        console.log('Departments data received:', departmentsData);
        setDepartmentOptions(departmentsData || []);
      } catch (deptError) {
        console.error('Error fetching departments:', deptError);
        message.error('Failed to load departments. Please try again later.');
        setDepartmentOptions([]);
      }
      
    } catch (error) {
      console.error('Error in data fetching process:', error);
      message.error('Failed to fetch organization data');
      setBranchOptions([]);
      setDepartmentOptions([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Simplified function to fetch all active users for the tenant
  const fetchAllUsers = async () => {
    try {
      console.log('Fetching all active users for tenant:', tenantId);
      
      // Simple params - just tenant and active status
      const params = { 
        tenant: tenantId,
        is_active: true
      };
      
      // Try both endpoints
      const endpoints = ['/auth/users/', '/users/'];
      let userData = [];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint ${endpoint}...`);
          const response = await api.get(endpoint, { params });
          
          if (Array.isArray(response.data)) {
            userData = response.data;
            break;
          } else if (response.data && Array.isArray(response.data.results)) {
            userData = response.data.results;
            break;
          } else if (response.data && typeof response.data === 'object') {
            userData = Object.values(response.data);
            break;
          }
        } catch (error) {
          console.log(`Failed with ${endpoint}:`, error.message);
          // Continue to next endpoint
        }
      }
      
      console.log(`Found ${userData.length} active users`);
      return userData;
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to load users');
      return [];
    }
  };
  
  // Simplified load member options
  useEffect(() => {
    if (formData.branch && formData.department && tenantId) {
      // Just load all users once for all roles
      fetchAllUsers().then(allUsers => {
        setMemberOptions(allUsers);
        setTeamLeadOptions(allUsers);
      }).catch(error => {
        console.error('Error loading users:', error);
      });
    }
  }, [formData.branch, formData.department, tenantId]);
  
  // Update useEffect to load department head options
  useEffect(() => {
    const loadUserOptions = async () => {
      if (!formData.branch || !formData.department || !tenantId) return;
      
      try {
        setLoading(true);
        console.log('Loading all users...');
        
        // Just get all users for the tenant
        const allUsers = await fetchAllUsers();
        
        // Set department head options to all users
        setDepartmentHeadOptions(allUsers);
        
        // Set all users as potential managers too
        setManagerOptions(allUsers);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading users:', error);
        setDepartmentHeadOptions([]);
        setManagerOptions([]);
        setLoading(false);
      }
    };
    
    loadUserOptions();
  }, [formData.branch, formData.department, tenantId]);
  
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
    
    // Simply fetch all users for any dialog type
    fetchAllUsers().then(allUsers => {
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
      console.error('Error fetching users for dialog:', error);
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
      
      // 1. Create the team
      const teamData = {
        name: formData.name,
        description: formData.description,
        tenant: tenantId,
        department: formData.department,
        branch: formData.branch,
        department_head: formData.department_head || null
      };
      
      console.log('Submitting team data:', teamData);
      
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
      
      // Navigate to the team detail page
      navigate(`/dashboard/teams/${teamId}`);
    } catch (error) {
      setSubmitting(false);
      console.error('Error creating team:', error);
      
      // Handle API validation errors more clearly
      if (error.response?.data) {
        const apiErrors = error.response.data;
        const formattedErrors = {};
        
        console.log('API returned errors:', apiErrors);
        
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
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return name || user.email || user.id;
  };
  
  // Add this to your component to track state changes
  useEffect(() => {
    console.log('Department head options updated:', departmentHeadOptions);
  }, [departmentHeadOptions]);

  useEffect(() => {
    console.log('Manager options updated:', managerOptions);
  }, [managerOptions]);
  
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
                          disabled={!formData.branch || !formData.department || loading}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 300,
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
                            departmentHeadOptions.map(head => (
                              <MenuItem key={head.id} value={head.id}>
                                {formatUserName(head)} {head.role && `(${head.role})`} {head.department?.name && `- ${head.department.name}`}
                              </MenuItem>
                            ))
                          )}
                        </Select>
                        
                        {errors.department_head && (
                          <FormHelperText>{errors.department_head}</FormHelperText>
                        )}
                        
                        {(!formData.branch || !formData.department) && (
                          <FormHelperText>
                            Please select branch and department first
                          </FormHelperText>
                        )}
                        
                        {formData.branch && formData.department && departmentHeadOptions.length === 0 && !loading && (
                          <FormHelperText>
                            No users found. Please make sure users exist for this tenant.
                          </FormHelperText>
                        )}
                        
                        {/* Show count of available options */}
                        {departmentHeadOptions.length > 0 && (
                          <FormHelperText>
                            {departmentHeadOptions.length} users available
                            {departmentHeadOptions.length > 10 && " - scroll to see all"}
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
            <>
              {/* Add search input for large lists */}
              <TextField
                fullWidth
                label="Search..."
                variant="outlined"
                value={dialogSearch}
                onChange={(e) => setDialogSearch(e.target.value)}
                sx={{ mb: 2 }}
                size="small"
              />
              
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
                  {/* No users available conditions */}
                  {dialogType === 'manager' && managerOptions.length === 0 ? (
                    <MenuItem disabled>No managers available</MenuItem>
                  ) : dialogType === 'teamLead' && teamLeadOptions.length === 0 ? (
                    <MenuItem disabled>No team leads available</MenuItem>
                  ) : dialogType === 'member' && memberOptions.length === 0 ? (
                    <MenuItem disabled>No members available</MenuItem>
                  ) : null}
                  
                  {/* Filter users based on search - for managers */}
                  {dialogType === 'manager' && managerOptions
                    .filter(option => {
                      const searchText = dialogSearch.toLowerCase();
                      return !searchText || 
                             formatUserName(option).toLowerCase().includes(searchText) ||
                             (option.email || '').toLowerCase().includes(searchText) ||
                             (option.department?.name || '').toLowerCase().includes(searchText);
                    })
                    .map(option => (
                      <MenuItem 
                        key={option.id} 
                        value={option.id}
                        disabled={managers.some(m => m.id === option.id)}
                      >
                        {formatUserName(option)} {option.department?.name && `(${option.department.name})`}
                      </MenuItem>
                    ))}
                  
                  {/* Apply similar filtering to team leads and members */}
                  {dialogType === 'teamLead' && teamLeadOptions
                    .filter(option => {
                      const searchText = dialogSearch.toLowerCase();
                      return !searchText || 
                             formatUserName(option).toLowerCase().includes(searchText) ||
                             (option.email || '').toLowerCase().includes(searchText) ||
                             (option.department?.name || '').toLowerCase().includes(searchText);
                    })
                    .map(option => (
                      <MenuItem 
                        key={option.id} 
                        value={option.id}
                        disabled={Object.values(teamLeadsMap).some(
                          teamLeads => teamLeads.some(tl => tl.id === option.id)
                        )}
                      >
                        {formatUserName(option)} {option.department?.name && `(${option.department.name})`}
                      </MenuItem>
                    ))}
                  
                  {dialogType === 'member' && memberOptions
                    .filter(option => {
                      const searchText = dialogSearch.toLowerCase();
                      return !searchText || 
                             formatUserName(option).toLowerCase().includes(searchText) ||
                             (option.email || '').toLowerCase().includes(searchText) ||
                             (option.role || '').toLowerCase().includes(searchText);
                    })
                    .map(option => (
                      <MenuItem 
                        key={option.id} 
                        value={option.id}
                        disabled={Object.values(teamMembersMap).some(
                          members => members.some(m => m.id === option.id)
                        )}
                      >
                        {formatUserName(option)} {option.role && `(${option.role})`}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* Show count of available options */}
              {dialogType === 'manager' && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {managerOptions.length} managers available
                  {managerOptions.length > 10 && " - scroll to see all"}
                </Typography>
              )}
              {dialogType === 'teamLead' && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {teamLeadOptions.length} team leads available
                  {teamLeadOptions.length > 10 && " - scroll to see all"}
                </Typography>
              )}
              {dialogType === 'member' && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {memberOptions.length} members available
                  {memberOptions.length > 10 && " - scroll to see all"}
                </Typography>
              )}
            </>
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