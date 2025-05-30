import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Grid, Paper, Button, 
  TextField, Switch, FormControlLabel, 
  CircularProgress, Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { message } from 'antd';
import api from '../../services/api';

const BranchForm = ({ 
  initialData = {}, 
  isEditMode = false, 
  onSuccess
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    is_active: initialData.is_active !== undefined ? initialData.is_active : true
  });
  const [errors, setErrors] = useState({});

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Handle switch/checkbox change
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Branch name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      message.error('Please fix the errors in the form');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get tenant_id from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      
      if (!tenantId) {
        message.error('Tenant information is missing. Please log in again.');
        navigate('/login');
        return;
      }
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        tenant: tenantId
      };
      
      console.log('Submitting branch with data:', submitData);
      
      // Try multiple possible endpoints
      const endpoints = [
        '/users/branches/',  // First try the registered endpoint from urls.py
        '/branches/',        // Fallback to direct branches endpoint
        '/auth/branches/'    // Last resort, try with auth prefix
      ];
      
      let response = null;
      let lastError = null;
      
      // Try each endpoint in order
      for (const endpoint of endpoints) {
        try {
          console.log(`Attempting to submit to endpoint: ${endpoint}`);
          
          if (isEditMode) {
            response = await api.put(`${endpoint}${initialData.id}/`, submitData);
          } else {
            response = await api.post(endpoint, submitData);
          }
          
          // If we get here, the request succeeded
          console.log(`Success with endpoint ${endpoint}!`, response.data);
          break;
        } catch (error) {
          console.error(`Error with endpoint ${endpoint}:`, error);
          lastError = error;
          // Continue to next endpoint
        }
      }
      
      // If all endpoints failed, throw the last error
      if (!response) {
        throw lastError || new Error('All API endpoints failed');
      }
      
      // Success message
      if (isEditMode) {
        message.success(`Branch "${formData.name}" updated successfully!`);
      } else {
        message.success(`Branch "${formData.name}" created successfully!`);
      }
      
      // Handle success callback
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Navigate back to branches list
      navigate('/dashboard/branches');
      
    } catch (error) {
      console.error('Error submitting branch:', error);
      
      // Handle validation errors from API
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
        message.error('Failed to save branch. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel/back
  const handleCancel = () => {
    navigate('/dashboard/branches');
  };

  return (
    <Container maxWidth="md" sx={{ pt: 2, pb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: 'white'
        }}
      >
        {/* Form Header */}
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
            {isEditMode ? `Edit Branch: ${initialData.name}` : 'Create New Branch'}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Branch Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Branch Name"
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
            
            {/* Active Status */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleSwitchChange}
                    name="is_active"
                    color="primary"
                  />
                }
                label="Branch is active"
              />
            </Grid>
            
            {/* Submit Buttons */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Branch')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default BranchForm; 