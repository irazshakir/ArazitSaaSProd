import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Grid, Paper, Button, 
  TextField, FormControl, InputLabel, Select, MenuItem,
  FormHelperText, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { message } from 'antd';
import api from '../../services/api';

const EditTeam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [team, setTeam] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    branch: '',
    department: '',
    team_lead: '',
    manager: ''
  });
  
  // Form errors state
  const [errors, setErrors] = useState({});
  
  // Options for dropdowns
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [managers, setManagers] = useState([]);
  
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
        fetchTeam(id);
        loadOptions(tenantId);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      message.error('Error loading user data. Please log in again.');
      navigate('/login');
    }
  }, [id, navigate]);
  
  // Fetch team data
  const fetchTeam = async (teamId) => {
    try {
      setLoading(true);
      const response = await api.get(`teams/${teamId}/`);
      const teamData = response.data;
      
      setTeam(teamData);
      
      // Update form data
      setFormData({
        name: teamData.name || '',
        description: teamData.description || '',
        branch: teamData.branch?.id || '',
        department: teamData.department?.id || '',
        team_lead: teamData.team_lead?.id || '',
        manager: teamData.manager?.id || ''
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching team:', error);
      message.error('Failed to load team data');
      setLoading(false);
      
      // Navigate back to teams list if team not found
      if (error.response?.status === 404) {
        navigate('/dashboard/teams');
      }
    }
  };
  
  // Load options for all dropdowns
  const loadOptions = async (tenantId) => {
    try {
      // Load branches
      const branchesResponse = await api.get('branches/', { params: { tenant: tenantId } });
      const branchesData = Array.isArray(branchesResponse.data) 
        ? branchesResponse.data 
        : branchesResponse.data?.results || [];
      setBranches(branchesData);
      
      // Load departments
      const departmentsResponse = await api.get('departments/');
      const departmentsData = Array.isArray(departmentsResponse.data) 
        ? departmentsResponse.data 
        : departmentsResponse.data?.results || [];
      setDepartments(departmentsData);
      
    } catch (error) {
      console.error('Error loading options:', error);
      message.error('Failed to load form options');
    }
  };
  
  // Load available users for team lead and manager when branch and department are selected
  useEffect(() => {
    const loadUsers = async () => {
      if (!formData.branch || !formData.department || !tenantId) return;
      
      try {
        setLoading(true);
        
        // Load team leads (users with team_lead role for this department/branch)
        const teamLeadsResponse = await api.get('users/', { 
          params: { 
            tenant: tenantId,
            branch: formData.branch,
            department: formData.department,
            role: 'team_lead'
          } 
        });
        
        const teamLeadsData = Array.isArray(teamLeadsResponse.data) 
          ? teamLeadsResponse.data 
          : teamLeadsResponse.data?.results || [];
        
        setTeamLeads(teamLeadsData);
        
        // Load managers (users with manager role for this department/branch)
        const managersResponse = await api.get('users/', { 
          params: { 
            tenant: tenantId,
            branch: formData.branch,
            department: formData.department,
            role: 'manager'
          } 
        });
        
        const managersData = Array.isArray(managersResponse.data) 
          ? managersResponse.data 
          : managersResponse.data?.results || [];
        
        setManagers(managersData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading users:', error);
        setLoading(false);
      }
    };
    
    loadUsers();
  }, [formData.branch, formData.department, tenantId]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle branch and department changes specially to trigger user loading
    if (name === 'branch' || name === 'department') {
      // If branch or department changes, reset team_lead and manager
      setFormData({
        ...formData,
        [name]: value,
        team_lead: '',
        manager: ''
      });
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
    
    // Prepare submission data
    const submitData = {
      ...formData,
      tenant: tenantId
    };
    
    // Remove empty fields
    Object.keys(submitData).forEach(key => {
      if (submitData[key] === '') {
        delete submitData[key];
      }
    });
    
    try {
      setSubmitting(true);
      
      // Update the team
      await api.put(`teams/${id}/`, submitData);
      
      setSubmitting(false);
      message.success('Team updated successfully!');
      
      // Navigate to the team detail page
      navigate(`/dashboard/teams/${id}`);
    } catch (error) {
      setSubmitting(false);
      console.error('Error updating team:', error);
      
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
  
  // Handle cancel/back
  const handleCancel = () => {
    navigate(`/dashboard/teams/${id}`);
  };
  
  if (loading && !team) {
    return (
      <Container maxWidth="md" sx={{ pt: 4, pb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ pt: 2, pb: 4 }}>
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
                Edit Team: {team?.name}
              </Typography>
            </Box>
            
            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Team Name */}
                <Grid item xs={12}>
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
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description}
                  />
                </Grid>
                
                {/* Branch */}
                <Grid item xs={12} md={6}>
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
                <Grid item xs={12} md={6}>
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
                
                {/* Team Lead */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.team_lead}>
                    <InputLabel>Team Lead</InputLabel>
                    <Select
                      name="team_lead"
                      value={formData.team_lead}
                      onChange={handleInputChange}
                      label="Team Lead"
                      disabled={!formData.branch || !formData.department}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {teamLeads.map(user => (
                        <MenuItem key={user.id} value={user.id}>
                          {`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.team_lead && <FormHelperText>{errors.team_lead}</FormHelperText>}
                    {(!formData.branch || !formData.department) && (
                      <FormHelperText>
                        Please select branch and department first
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                {/* Manager */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.manager}>
                    <InputLabel>Manager</InputLabel>
                    <Select
                      name="manager"
                      value={formData.manager}
                      onChange={handleInputChange}
                      label="Manager"
                      disabled={!formData.branch || !formData.department}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {managers.map(user => (
                        <MenuItem key={user.id} value={user.id}>
                          {`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.manager && <FormHelperText>{errors.manager}</FormHelperText>}
                    {(!formData.branch || !formData.department) && (
                      <FormHelperText>
                        Please select branch and department first
                      </FormHelperText>
                    )}
                  </FormControl>
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
    </Container>
  );
};

export default EditTeam; 