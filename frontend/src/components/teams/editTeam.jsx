import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Grid, Paper, Button, 
  TextField, FormControl, InputLabel, Select, MenuItem,
  FormHelperText, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, List, ListItem, ListItemText,
  ListItemSecondaryAction, IconButton, Divider, Avatar,
  ListItemAvatar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { message } from 'antd';
import api from '../../services/api';

// ... existing code ...

const EditTeam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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
  
  // Form errors state
  const [errors, setErrors] = useState({});
  
  // Options for dropdowns
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentHeads, setDepartmentHeads] = useState([]);
  
  // Team members structure - similar to createTeam.jsx
  const [managers, setManagers] = useState([]);
  const [availableManagers, setAvailableManagers] = useState([]);
  const [availableTeamLeads, setAvailableTeamLeads] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [dialogValue, setDialogValue] = useState('');
  const [currentManagerId, setCurrentManagerId] = useState(null);
  const [currentTeamLeadId, setCurrentTeamLeadId] = useState(null);
  
  // Get tenant ID from localStorage and load team data
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const tenantId = localStorage.getItem('tenant_id');
      setTenantId(tenantId);
      
      // Load team data and options
      if (tenantId && id) {
        loadInitialOptions(tenantId);
      }
    } catch (error) {
      message.error('Error loading user data. Please log in again.');
      navigate('/login');
    }
  }, [id, navigate]);
  
  // Load initial options for dropdowns
  const loadInitialOptions = async (tenantId) => {
    try {
      setLoading(true);
      
      // Load branches with fallback endpoints
      let branchesData = [];
      try {
        // Try main endpoint first
      const branchesResponse = await api.get('branches/', { params: { tenant: tenantId } });
        branchesData = Array.isArray(branchesResponse.data) 
          ? branchesResponse.data 
          : branchesResponse.data?.results || [];
      } catch (error) {
        // Try auth endpoint
        const branchesResponse = await api.get('auth/branches/', { params: { tenant: tenantId } });
        branchesData = Array.isArray(branchesResponse.data) 
          ? branchesResponse.data 
          : branchesResponse.data?.results || [];
      }
      
      setBranches(branchesData);
      
      // Load departments with fallback endpoints
      let departmentsData = [];
      try {
        // Try main endpoint first
        const departmentsResponse = await api.get('departments/', { params: { tenant: tenantId } });
        departmentsData = Array.isArray(departmentsResponse.data) 
          ? departmentsResponse.data 
          : departmentsResponse.data?.results || [];
      } catch (error) {
        // Try auth endpoint
        const departmentsResponse = await api.get('auth/departments/', { params: { tenant: tenantId } });
        departmentsData = Array.isArray(departmentsResponse.data) 
          ? departmentsResponse.data 
          : departmentsResponse.data?.results || [];
      }
      
      setDepartments(departmentsData);
      
      // After loading initial options, fetch the team
      await fetchTeam(id);
      
      setLoading(false);
    } catch (error) {
      message.error('Failed to load form options');
      setLoading(false);
    }
  };
  
  // Fetch team data with fallback endpoints
  const fetchTeam = async (teamId) => {
    try {
      let teamData = null;
      
      try {
        // Try main endpoint first
      const response = await api.get(`teams/${teamId}/`);
        teamData = response.data;
      } catch (error) {
        // Try auth endpoint
        const response = await api.get(`auth/teams/${teamId}/`);
        teamData = response.data;
      }
      
      if (!teamData) {
        throw new Error('No valid response for team data');
      }
      
      // Update form data with basic team info
      setFormData({
        name: teamData.name || '',
        description: teamData.description || '',
        branch: teamData.branch || '',
        department: teamData.department || '',
        department_head: teamData.department_head || ''
      });
      
      // Load department heads based on branch and department
      if (teamData.branch && teamData.department) {
        await loadDepartmentHeads(teamData.branch, teamData.department);
      }
      
      // Now fetch team hierarchy data - managers, team leads, and members
      await fetchTeamHierarchy(teamId);
      
    } catch (error) {
      message.error('Failed to load team data');
      
      // Navigate back to teams list if team not found
      if (error.response?.status === 404) {
        navigate('/dashboard/teams');
      }
    }
  };
  
  // Fetch team hierarchy with fallback endpoints
  const fetchTeamHierarchy = async (teamId) => {
    try {
      let hierarchyData = null;
      
      try {
        // Attempt to fetch complete hierarchy with main endpoint
      const response = await api.get(`teams/${teamId}/hierarchy/`);
        hierarchyData = response.data;
      } catch (error) {
        // Try auth endpoint
        const response = await api.get(`auth/teams/${teamId}/hierarchy/`);
        hierarchyData = response.data;
      }
      
      if (hierarchyData) {
      // Setup managers array with team leads and members
      if (hierarchyData.managers && Array.isArray(hierarchyData.managers)) {
        // Map the managers data to our structure
        const managersData = hierarchyData.managers.map(manager => {
          return {
            id: manager.id,
            manager: manager.manager,
            manager_details: manager.manager_details,
            team_leads: (manager.team_leads || []).map(teamLead => {
              return {
                id: teamLead.id,
                team_lead: teamLead.team_lead,
                team_lead_details: teamLead.team_lead_details,
                members: teamLead.members || []
              };
            })
          };
        });
        
        setManagers(managersData);
      }
      } else {
        // Fallback to fetching individual parts
        // First fetch managers with fallback endpoints
        let managersData = [];
        
        try {
          const managersResponse = await api.get(`teams/${teamId}/managers/`);
          managersData = Array.isArray(managersResponse.data) 
            ? managersResponse.data 
            : managersResponse.data?.results || [];
        } catch (error) {
          // Try auth endpoint
          const managersResponse = await api.get(`auth/teams/${teamId}/managers/`);
          managersData = Array.isArray(managersResponse.data) 
            ? managersResponse.data 
            : managersResponse.data?.results || [];
        }
      
      // For each manager, fetch team leads
      const managersWithLeads = await Promise.all(managersData.map(async (manager) => {
          let teamLeadsData = [];
          
          try {
            const teamLeadsResponse = await api.get(`team-managers/${manager.id}/team_leads/`);
            teamLeadsData = Array.isArray(teamLeadsResponse.data) 
              ? teamLeadsResponse.data 
              : teamLeadsResponse.data?.results || [];
          } catch (error) {
            // Try auth endpoint
            const teamLeadsResponse = await api.get(`auth/team-managers/${manager.id}/team_leads/`);
            teamLeadsData = Array.isArray(teamLeadsResponse.data) 
              ? teamLeadsResponse.data 
              : teamLeadsResponse.data?.results || [];
          }
        
        // For each team lead, fetch members
        const teamLeadsWithMembers = await Promise.all(teamLeadsData.map(async (teamLead) => {
            let membersData = [];
            
            try {
              const membersResponse = await api.get(`team-leads/${teamLead.id}/members/`);
              membersData = Array.isArray(membersResponse.data) 
                ? membersResponse.data 
                : membersResponse.data?.results || [];
            } catch (error) {
              // Try auth endpoint
              const membersResponse = await api.get(`auth/team-leads/${teamLead.id}/members/`);
              membersData = Array.isArray(membersResponse.data) 
                ? membersResponse.data 
                : membersResponse.data?.results || [];
            }
          
          return {
            ...teamLead,
            members: membersData
          };
        }));
        
        return {
          ...manager,
          team_leads: teamLeadsWithMembers
        };
      }));
      
      setManagers(managersWithLeads);
      }
        
        // Load available managers, team leads and members for this team
        await fetchAllUsers();
      
    } catch (error) {
      message.error('Failed to load team hierarchy');
    }
  };
  
  // Load department heads with fallback endpoints
  const loadDepartmentHeads = async (branchId, departmentId) => {
    try {
      let headsData = [];
      
      try {
        // Fetch users with department_head role - main endpoint
      const response = await api.get('users/', {
        params: {
          tenant: tenantId,
          branch: branchId,
          department: departmentId,
          role: 'department_head'
        }
      });
        headsData = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];
      } catch (error) {
        // Try auth endpoint
        const response = await api.get('auth/users/', {
          params: {
            tenant: tenantId,
            branch: branchId,
            department: departmentId,
            role: 'department_head'
          }
        });
        headsData = Array.isArray(response.data)
          ? response.data
          : response.data?.results || [];
      }
      
      setDepartmentHeads(headsData);
    } catch (error) {
      message.error('Error loading department heads:');
    }
  };
  
  // Fetch all available users with fallback endpoints
  const fetchAllUsers = async () => {
    try {
      // Get current branch and department from form data
      const { branch, department } = formData;
      
      if (!branch || !department) {
        return;
      }
      
      // Fetch available managers with fallback endpoints
      let managersData = [];
      
      try {
        const managersResponse = await api.get('users/', {
          params: {
            tenant: tenantId,
            branch: branch,
            department: department,
            role: 'manager'
          }
        });
        managersData = Array.isArray(managersResponse.data)
          ? managersResponse.data
          : managersResponse.data?.results || [];
      } catch (error) {
        // Try auth endpoint
        const managersResponse = await api.get('auth/users/', {
          params: {
            tenant: tenantId,
            branch: branch,
            department: department,
            role: 'manager'
          }
        });
        managersData = Array.isArray(managersResponse.data)
          ? managersResponse.data
          : managersResponse.data?.results || [];
      }
      
      // Filter out managers already assigned to the team
      const assignedManagerIds = managers.map(m => m.manager);
      const filteredManagers = managersData.filter(m => !assignedManagerIds.includes(m.id));
      
      setAvailableManagers(filteredManagers);
      
      // Fetch available team leads with fallback endpoints
      let teamLeadsData = [];
      
      try {
        const teamLeadsResponse = await api.get('users/', {
          params: {
            tenant: tenantId,
            branch: branch,
            department: department,
            role: 'team_lead'
          }
        });
        teamLeadsData = Array.isArray(teamLeadsResponse.data)
          ? teamLeadsResponse.data
          : teamLeadsResponse.data?.results || [];
      } catch (error) {
        // Try auth endpoint
        const teamLeadsResponse = await api.get('auth/users/', {
          params: {
            tenant: tenantId,
            branch: branch,
            department: department,
            role: 'team_lead'
          }
        });
        teamLeadsData = Array.isArray(teamLeadsResponse.data)
          ? teamLeadsResponse.data
          : teamLeadsResponse.data?.results || [];
      }
      
      // We'll filter these when adding to a specific manager
      setAvailableTeamLeads(teamLeadsData);
      
      // Fetch available members with fallback endpoints
      let membersData = [];
      
      try {
        const membersResponse = await api.get('users/', {
          params: {
            tenant: tenantId,
            branch: branch,
            department: department,
            role__in: 'sales_agent,support_agent,processor' // Multiple roles
          }
        });
        membersData = Array.isArray(membersResponse.data)
          ? membersResponse.data
          : membersResponse.data?.results || [];
      } catch (error) {
        // Try auth endpoint
        const membersResponse = await api.get('auth/users/', {
          params: {
            tenant: tenantId,
            branch: branch,
            department: department,
            role__in: 'sales_agent,support_agent,processor' // Multiple roles
          }
        });
        membersData = Array.isArray(membersResponse.data)
          ? membersResponse.data
          : membersResponse.data?.results || [];
      }
      
      setAvailableMembers(membersData);
      
    } catch (error) {
      message.error('Failed to load available users');
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle branch and department changes specially
    if (name === 'branch' || name === 'department') {
      setFormData({
        ...formData,
        [name]: value,
        department_head: '' // Reset department head when branch or department changes
      });
      
      // If both branch and department are selected, load department heads
      if (
        (name === 'branch' && formData.department) || 
        (name === 'department' && formData.branch)
      ) {
        const branchId = name === 'branch' ? value : formData.branch;
        const departmentId = name === 'department' ? value : formData.department;
        loadDepartmentHeads(branchId, departmentId);
        
        // Also reload available users
        fetchAllUsers();
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Handle dialog open for adding managers, team leads, or members
  const handleOpenDialog = (type, managerId = null, teamLeadId = null) => {
    setDialogType(type);
    setDialogValue('');
    setCurrentManagerId(managerId);
    setCurrentTeamLeadId(teamLeadId);
    setDialogOpen(true);
  };
  
  // Handle dialog option change
  const handleDialogOptionChange = (e) => {
    setDialogValue(e.target.value);
  };
  
  // Handle adding from dialog
  const handleAddFromDialog = () => {
    if (!dialogValue) {
      message.error('Please select a value');
      return;
    }
    
    if (dialogType === 'manager') {
      // Find the selected manager from available managers
      const selectedManager = availableManagers.find(m => m.id === dialogValue);
      if (!selectedManager) return;
      
      // Add the new manager to the team
      const newManager = {
        id: `temp-${Date.now()}`, // Temporary ID until saved
        manager: selectedManager.id,
        manager_details: {
          id: selectedManager.id,
          email: selectedManager.email,
          first_name: selectedManager.first_name,
          last_name: selectedManager.last_name
        },
        team_leads: []
      };
      
      setManagers([...managers, newManager]);
      
      // Remove this manager from available managers
      setAvailableManagers(availableManagers.filter(m => m.id !== dialogValue));
    } 
    else if (dialogType === 'team_lead') {
      if (!currentManagerId) return;
      
      // Find the selected team lead from available team leads
      const selectedTeamLead = availableTeamLeads.find(tl => tl.id === dialogValue);
      if (!selectedTeamLead) return;
      
      // Add the new team lead to the specified manager
      const updatedManagers = managers.map(manager => {
        if (manager.id === currentManagerId) {
          return {
            ...manager,
            team_leads: [
              ...manager.team_leads,
              {
                id: `temp-${Date.now()}`, // Temporary ID until saved
                team_lead: selectedTeamLead.id,
                team_lead_details: {
                  id: selectedTeamLead.id,
                  email: selectedTeamLead.email,
                  first_name: selectedTeamLead.first_name,
                  last_name: selectedTeamLead.last_name
                },
                members: []
              }
            ]
          };
        }
        return manager;
      });
      
      setManagers(updatedManagers);
    } 
    else if (dialogType === 'member') {
      if (!currentManagerId || !currentTeamLeadId) return;
      
      // Find the selected member from available members
      const selectedMember = availableMembers.find(m => m.id === dialogValue);
      if (!selectedMember) return;
      
      // Add the new member to the specified team lead
      const updatedManagers = managers.map(manager => {
        if (manager.id === currentManagerId) {
          return {
            ...manager,
            team_leads: manager.team_leads.map(teamLead => {
              if (teamLead.id === currentTeamLeadId) {
                return {
                  ...teamLead,
                  members: [
                    ...teamLead.members,
                    {
                      id: `temp-${Date.now()}`, // Temporary ID until saved
                      member: selectedMember.id,
                      member_details: {
                        id: selectedMember.id,
                        email: selectedMember.email,
                        first_name: selectedMember.first_name,
                        last_name: selectedMember.last_name
                      }
                    }
                  ]
                };
              }
              return teamLead;
            })
          };
        }
        return manager;
      });
      
      setManagers(updatedManagers);
    }
    
    // Close the dialog
    setDialogOpen(false);
  };
  
  // Handle removing a manager
  const handleRemoveManager = (managerId) => {
    // Find the manager to remove
    const managerToRemove = managers.find(m => m.id === managerId);
    
    // Remove the manager
    setManagers(managers.filter(m => m.id !== managerId));
    
    // Add the manager back to available managers if it has user details
    if (managerToRemove?.manager_details) {
      const managerUser = {
        id: managerToRemove.manager_details.id,
        email: managerToRemove.manager_details.email,
        first_name: managerToRemove.manager_details.first_name,
        last_name: managerToRemove.manager_details.last_name
      };
      
      setAvailableManagers([...availableManagers, managerUser]);
    }
  };
  
  // Handle removing a team lead
  const handleRemoveTeamLead = (managerId, teamLeadId) => {
    // Update managers list
    const updatedManagers = managers.map(manager => {
      if (manager.id === managerId) {
        // Find the team lead to remove
        const teamLeadToRemove = manager.team_leads.find(tl => tl.id === teamLeadId);
        
        // If we have team lead details, add it back to available team leads
        if (teamLeadToRemove?.team_lead_details) {
          const teamLeadUser = {
            id: teamLeadToRemove.team_lead_details.id,
            email: teamLeadToRemove.team_lead_details.email,
            first_name: teamLeadToRemove.team_lead_details.first_name,
            last_name: teamLeadToRemove.team_lead_details.last_name
          };
          
          // Add back to available team leads if not already there
          if (!availableTeamLeads.some(tl => tl.id === teamLeadUser.id)) {
            setAvailableTeamLeads([...availableTeamLeads, teamLeadUser]);
          }
        }
        
        // Remove the team lead from this manager
        return {
          ...manager,
          team_leads: manager.team_leads.filter(tl => tl.id !== teamLeadId)
        };
      }
      return manager;
    });
    
    setManagers(updatedManagers);
  };
  
  // Handle removing a member
  const handleRemoveMember = (managerId, teamLeadId, memberId) => {
    // Update managers list
    const updatedManagers = managers.map(manager => {
      if (manager.id === managerId) {
        return {
          ...manager,
          team_leads: manager.team_leads.map(teamLead => {
            if (teamLead.id === teamLeadId) {
              // Find the member to remove
              const memberToRemove = teamLead.members.find(m => m.id === memberId);
              
              // If we have member details, add it back to available members
              if (memberToRemove?.member_details) {
                const memberUser = {
                  id: memberToRemove.member_details.id,
                  email: memberToRemove.member_details.email,
                  first_name: memberToRemove.member_details.first_name,
                  last_name: memberToRemove.member_details.last_name
                };
                
                // Add back to available members if not already there
                if (!availableMembers.some(m => m.id === memberUser.id)) {
                  setAvailableMembers([...availableMembers, memberUser]);
                }
              }
              
              // Remove the member from this team lead
              return {
                ...teamLead,
                members: teamLead.members.filter(m => m.id !== memberId)
              };
            }
            return teamLead;
          })
        };
      }
      return manager;
    });
    
    setManagers(updatedManagers);
  };
  
  // Helper function to format user name
  const formatUserName = (user) => {
    if (!user) return 'Unknown User';
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.email || 'Unnamed User';
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
      
      // Step 1: Update the basic team information
      const teamData = {
        name: formData.name,
        description: formData.description,
        branch: formData.branch,
        department: formData.department,
        department_head: formData.department_head || null,
        tenant: tenantId
      };
      
      // Update the team with fallback endpoints
      try {
        await api.put(`teams/${id}/`, teamData);
      } catch (error) {
        try {
          await api.put(`auth/teams/${id}/`, teamData);
        } catch (error2) {
          await api.put(`admin/teams/${id}/`, teamData);
        }
      }
      
      // Step 2: Process team hierarchy
      
      // First, let's handle deletions - we'll compare the current state with the original state
      // Get the original hierarchy data to compare what needs to be deleted
      let originalHierarchyData = null;
      try {
        // Use the same endpoint fallback strategy as we did when loading
        try {
          const response = await api.get(`teams/${id}/hierarchy/`);
          originalHierarchyData = response.data;
        } catch (error) {
          try {
            const response = await api.get(`auth/teams/${id}/hierarchy/`);
            originalHierarchyData = response.data;
          } catch (error2) {
            try {
              const response = await api.get(`admin/teams/${id}/hierarchy/`);
              originalHierarchyData = response.data;
            } catch (error3) {
            }
          }
        }
        
        if (originalHierarchyData) {
          // Handle deletion of managers, team leads, and members
          await handleDeletions(originalHierarchyData);
        }
      } catch (deletionError) {
        // Continue anyway to try the additions
      }
      
      // Next, handle additions
      const apiCalls = [];
      
      // Process managers
      for (const manager of managers) {
        // If manager has a temporary ID, it's a new manager to be created
        if (manager.id.toString().startsWith('temp-')) {
          const managerData = {
            team: id,
            manager: manager.manager
          };
          
          apiCalls.push(async () => {
            try {
              const managerResponse = await api.post('team-managers/', managerData);
              const newManagerId = managerResponse.data.id;
              
              // Process team leads for this manager
              for (const teamLead of manager.team_leads) {
                // If team lead has a temporary ID, it's new
                if (teamLead.id.toString().startsWith('temp-')) {
                  const teamLeadData = {
                    team: id,
                    manager: newManagerId,
                    team_lead: teamLead.team_lead
                  };
                  
                  try {
                    const teamLeadResponse = await api.post('team-leads/', teamLeadData);
                    const newTeamLeadId = teamLeadResponse.data.id;
                    
                    // Process members for this team lead
                    for (const member of teamLead.members) {
                      if (member.id.toString().startsWith('temp-')) {
                        const memberData = {
                          team: id,
                          team_lead: newTeamLeadId,
                          member: member.member
                        };
                        
                        try {
                          await api.post('team-members/', memberData);
                        } catch (memberError) {
                          // Failed to add team member
                        }
                      }
                    }
                  } catch (teamLeadError) {
                    // Failed to add team lead
                  }
                }
              }
            } catch (managerError) {
              // Failed to add team manager
            }
          });
        } else {
          // Existing manager, handle team leads
          for (const teamLead of manager.team_leads) {
            // If team lead has a temporary ID, it's new
            if (teamLead.id.toString().startsWith('temp-')) {
              const teamLeadData = {
                team: id,
                manager: manager.id,
                team_lead: teamLead.team_lead
              };
              
              apiCalls.push(async () => {
                try {
                  const teamLeadResponse = await api.post('team-leads/', teamLeadData);
                  const newTeamLeadId = teamLeadResponse.data.id;
                  
                  // Process members for this team lead
                  for (const member of teamLead.members) {
                    if (member.id.toString().startsWith('temp-')) {
                      const memberData = {
                        team: id,
                        team_lead: newTeamLeadId,
                        member: member.member
                      };
                      
                      try {
                        await api.post('team-members/', memberData);
                      } catch (memberError) {
                        // Failed to add team member
                      }
                    }
                  }
                } catch (teamLeadError) {
                  // Failed to add team lead
                }
              });
            } else {
              // Existing team lead, handle members
              for (const member of teamLead.members) {
                if (member.id.toString().startsWith('temp-')) {
                  const memberData = {
                    team: id,
                    team_lead: teamLead.id,
                    member: member.member
                  };
                  
                  apiCalls.push(async () => {
                    try {
                      await api.post('team-members/', memberData);
                    } catch (memberError) {
                      // Failed to add team member
                    }
                  });
                }
              }
            }
          }
        }
      }
      
      // Execute all API calls - we'll continue even if some fail
      if (apiCalls.length > 0) {
        try {
          await Promise.allSettled(apiCalls.map(call => call()));
        } catch (hierarchyError) {
          // Continue anyway - main team data has been saved
        }
      }
      
      setSubmitting(false);
      message.success('Team updated successfully!');
      
      // Navigate back to the teams list
      navigate('/dashboard/teams');
      
    } catch (error) {
      setSubmitting(false);
      
      // Handle API validation errors
      if (error.response?.data) {
        const apiErrors = error.response.data;
        const formattedErrors = {};
        
        Object.keys(apiErrors).forEach(key => {
          formattedErrors[key] = Array.isArray(apiErrors[key]) 
            ? apiErrors[key][0] 
            : apiErrors[key];
        });
        
        setErrors(formattedErrors);
        message.error('Please correct the errors in the form');
      } else {
        message.error('Failed to update team. Please try again.');
      }
    }
  };
  
  // New function to handle deletions of team members, team leads, and managers
  const handleDeletions = async (originalHierarchy) => {
    try {
      // Only attempt deletion comparisons if we have original hierarchy data
      if (originalHierarchy && originalHierarchy.managers) {
        // Helper function to check if a manager exists in current state
        const managerExists = (managerId) => {
          return managers.some(m => m.id === managerId);
        };
        
        // Helper function to check if a team lead exists under a manager
        const teamLeadExists = (managerId, teamLeadId) => {
          const manager = managers.find(m => m.id === managerId);
          if (!manager) return false;
          
          const teamLeads = manager.team_leads || [];
          return teamLeads.some(tl => tl.id === teamLeadId);
        };
        
        // Helper function to check if a member exists under a team lead
        const memberExists = (teamLeadId, memberId) => {
          // Find manager containing this team lead
          let found = false;
          managers.forEach(manager => {
            (manager.team_leads || []).forEach(teamLead => {
              if (teamLead.id === teamLeadId) {
                // Found the team lead, now check if member exists
                found = (teamLead.members || []).some(m => m.id === memberId);
              }
            });
          });
          return found;
        };
        
        // Check for deleted members under existing team leads
        for (const originalManager of originalHierarchy.managers) {
          if (managerExists(originalManager.id)) {
            // Manager still exists, check for deleted team leads and members
            for (const originalTeamLead of (originalManager.team_leads || [])) {
              if (teamLeadExists(originalManager.id, originalTeamLead.id)) {
                // Team lead still exists, check for deleted members
                for (const originalMember of (originalTeamLead.members || [])) {
                  if (!memberExists(originalTeamLead.id, originalMember.id)) {
                    // Member has been deleted, delete it from API
                    try {
                      await api.delete(`team-members/${originalMember.id}/`);
                    } catch (error) {
                      try {
                        await api.delete(`auth/team-members/${originalMember.id}/`);
                      } catch (error2) {
                        try {
                          await api.delete(`admin/team-members/${originalMember.id}/`);
                        } catch (error3) {
                          // Silent error - tried all endpoints
                        }
                      }
                    }
                  }
                }
              } else {
                // Team lead was deleted - delete all its members first
                for (const originalMember of (originalTeamLead.members || [])) {
                  try {
                    await api.delete(`team-members/${originalMember.id}/`);
                  } catch (error) {
                    try {
                      await api.delete(`auth/team-members/${originalMember.id}/`);
                    } catch (error2) {
                      try {
                        await api.delete(`admin/team-members/${originalMember.id}/`);
                      } catch (error3) {
                        // Silent error - tried all endpoints
                      }
                    }
                  }
                }
                
                // Then delete the team lead itself
                try {
                  await api.delete(`team-leads/${originalTeamLead.id}/`);
                } catch (error) {
                  try {
                    await api.delete(`auth/team-leads/${originalTeamLead.id}/`);
                  } catch (error2) {
                    try {
                      await api.delete(`admin/team-leads/${originalTeamLead.id}/`);
                    } catch (error3) {
                      // Silent error - tried all endpoints
                    }
                  }
                }
              }
            }
          } else {
            // Manager was deleted - delete all team leads and members first
            for (const originalTeamLead of (originalManager.team_leads || [])) {
              // Delete all members of this team lead
              for (const originalMember of (originalTeamLead.members || [])) {
                try {
                  await api.delete(`team-members/${originalMember.id}/`);
                } catch (error) {
                  try {
                    await api.delete(`auth/team-members/${originalMember.id}/`);
                  } catch (error2) {
                    try {
                      await api.delete(`admin/team-members/${originalMember.id}/`);
                    } catch (error3) {
                      // Silent error - tried all endpoints
                    }
                  }
                }
              }
              
              // Then delete the team lead
              try {
                await api.delete(`team-leads/${originalTeamLead.id}/`);
              } catch (error) {
                try {
                  await api.delete(`auth/team-leads/${originalTeamLead.id}/`);
                } catch (error2) {
                  try {
                    await api.delete(`admin/team-leads/${originalTeamLead.id}/`);
                  } catch (error3) {
                    // Silent error - tried all endpoints
                  }
                }
              }
            }
            
            // Finally, delete the manager
            try {
              await api.delete(`team-managers/${originalManager.id}/`);
            } catch (error) {
              try {
                await api.delete(`auth/team-managers/${originalManager.id}/`);
              } catch (error2) {
                try {
                  await api.delete(`admin/team-managers/${originalManager.id}/`);
                } catch (error3) {
                  // Silent error - tried all endpoints
                }
              }
            }
          }
        }
      }
    } catch (error) {
      throw error;
    }
  };
  
  // Handle cancel/back
  const handleCancel = () => {
    navigate('/dashboard/teams');
  };
  
  if (loading) {
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
                Edit Team: {formData.name}
              </Typography>
            </Box>
            
            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Basic Info Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Basic Information
                  </Typography>
                  
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
                    multiline
                        rows={1}
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
                    >
                      {branches.map(branch => (
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
                    >
                      {departments.map(department => (
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
                          value={formData.department_head || ''}
                      onChange={handleInputChange}
                          label="Department Head"
                      disabled={!formData.branch || !formData.department}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                          {departmentHeads.map(user => (
                        <MenuItem key={user.id} value={user.id}>
                              {formatUserName(user)}
                        </MenuItem>
                      ))}
                    </Select>
                        {errors.department_head && <FormHelperText>{errors.department_head}</FormHelperText>}
                    {(!formData.branch || !formData.department) && (
                      <FormHelperText>
                        Please select branch and department first
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                  </Grid>
                </Grid>
                
                {/* Team Structure Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
                    Team Structure
                  </Typography>
                  
                  {/* Managers Section */}
                  <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Managers
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog('manager')}
                        disabled={!formData.branch || !formData.department || availableManagers.length === 0}
                      >
                        Add Manager
                      </Button>
                    </Box>
                    
                    {managers.length === 0 ? (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 2 }}>
                        No managers assigned to this team yet.
                      </Typography>
                    ) : (
                      <List dense sx={{ bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                        {managers.map((manager) => (
                          <React.Fragment key={manager.id}>
                            <ListItem
                              secondaryAction={
                                <IconButton edge="end" onClick={() => handleRemoveManager(manager.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              }
                            >
                              <ListItemAvatar>
                                <Avatar>{manager.manager_details?.first_name?.charAt(0) || 'M'}</Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={formatUserName(manager.manager_details)}
                                secondary={manager.manager_details?.email || 'No email'}
                              />
                            </ListItem>
                            
                            {/* Team Leads Section for this manager */}
                            <Box sx={{ pl: 6, pr: 2, pb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Team Leads
                                </Typography>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => handleOpenDialog('team_lead', manager.id)}
                                  disabled={availableTeamLeads.length === 0}
                                >
                                  Add Team Lead
                                </Button>
                              </Box>
                              
                              {manager.team_leads && manager.team_leads.length > 0 ? (
                                <List dense sx={{ bgcolor: '#f0f0f0', borderRadius: 1, mb: 1 }}>
                                  {manager.team_leads.map((teamLead) => (
                                    <React.Fragment key={teamLead.id}>
                                      <ListItem
                                        secondaryAction={
                                          <IconButton edge="end" onClick={() => handleRemoveTeamLead(manager.id, teamLead.id)}>
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        }
                                      >
                                        <ListItemAvatar>
                                          <Avatar sx={{ width: 30, height: 30 }}>{teamLead.team_lead_details?.first_name?.charAt(0) || 'T'}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                          primary={formatUserName(teamLead.team_lead_details)}
                                          secondary={teamLead.team_lead_details?.email || 'No email'}
                                        />
                                      </ListItem>
                                      
                                      {/* Members Section for this team lead */}
                                      <Box sx={{ pl: 4, pr: 2, pb: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            Members
                                          </Typography>
                                          <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<AddIcon />}
                                            onClick={() => handleOpenDialog('member', manager.id, teamLead.id)}
                                            disabled={availableMembers.length === 0}
                                          >
                                            Add Member
                                          </Button>
                                        </Box>
                                        
                                        {teamLead.members && teamLead.members.length > 0 ? (
                                          <List dense sx={{ bgcolor: '#e8e8e8', borderRadius: 1 }}>
                                            {teamLead.members.map((member) => (
                                              <ListItem
                                                key={member.id}
                                                secondaryAction={
                                                  <IconButton edge="end" onClick={() => handleRemoveMember(manager.id, teamLead.id, member.id)}>
                                                    <DeleteIcon fontSize="small" />
                                                  </IconButton>
                                                }
                                              >
                                                <ListItemAvatar>
                                                  <Avatar sx={{ width: 24, height: 24 }}>{member.member_details?.first_name?.charAt(0) || 'M'}</Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                  primary={formatUserName(member.member_details)}
                                                  secondary={member.member_details?.email || 'No email'}
                                                />
                                              </ListItem>
                                            ))}
                                          </List>
                                        ) : (
                                          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 1, pl: 2 }}>
                                            No members assigned to this team lead yet.
                                          </Typography>
                                        )}
                                      </Box>
                                      
                                      {manager.team_leads.length > 1 && manager.team_leads.indexOf(teamLead) < manager.team_leads.length - 1 && (
                                        <Divider variant="inset" component="li" />
                                      )}
                                    </React.Fragment>
                                  ))}
                                </List>
                              ) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 1, pl: 2 }}>
                                  No team leads assigned to this manager yet.
                                </Typography>
                              )}
                            </Box>
                            
                            {managers.length > 1 && managers.indexOf(manager) < managers.length - 1 && (
                              <Divider component="li" />
                            )}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </Paper>
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
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Add User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'manager' ? 'Add Manager' : 
           dialogType === 'team_lead' ? 'Add Team Lead' : 'Add Member'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>
              {dialogType === 'manager' ? 'Manager' : 
               dialogType === 'team_lead' ? 'Team Lead' : 'Member'}
            </InputLabel>
            <Select
              value={dialogValue}
              onChange={handleDialogOptionChange}
              label={dialogType === 'manager' ? 'Manager' : 
                    dialogType === 'team_lead' ? 'Team Lead' : 'Member'}
            >
              {dialogType === 'manager' && availableManagers.map(manager => (
                <MenuItem key={manager.id} value={manager.id}>
                  {formatUserName(manager)}
                </MenuItem>
              ))}
              
              {dialogType === 'team_lead' && availableTeamLeads.map(teamLead => (
                <MenuItem key={teamLead.id} value={teamLead.id}>
                  {formatUserName(teamLead)}
                </MenuItem>
              ))}
              
              {dialogType === 'member' && availableMembers.map(member => (
                <MenuItem key={member.id} value={member.id}>
                  {formatUserName(member)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddFromDialog} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EditTeam; 