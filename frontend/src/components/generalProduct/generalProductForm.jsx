import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Grid, Paper, Button, 
  TextField, CircularProgress, Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { message } from 'antd';
import api from '../../services/api';

const GeneralProductForm = ({ 
  initialData = {}, 
  isEditMode = false, 
  onSuccess
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productName: initialData.productName || '',
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

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
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
      
      let response;
      if (isEditMode) {
        response = await api.put(`general-product/products/${initialData.id}/`, submitData);
      } else {
        response = await api.post('general-product/products/', submitData);
      }
      
      // Success message
      message.success(
        isEditMode 
          ? `Product "${formData.productName}" updated successfully!`
          : `Product "${formData.productName}" created successfully!`
      );
      
      // Handle success callback
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Navigate back to products list
      navigate('/dashboard/general-products');
      
    } catch (error) {
      console.error('Error submitting product:', error);
      
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
        message.error('Failed to save product. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel/back
  const handleCancel = () => {
    navigate('/dashboard/general-products');
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
            {isEditMode ? `Edit Product: ${initialData.productName}` : 'Create New Product'}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Product Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Name"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                error={!!errors.productName}
                helperText={errors.productName}
                required
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
                  {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Product')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default GeneralProductForm;
