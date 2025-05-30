import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Box, Breadcrumbs, Link as MuiLink, CircularProgress } from '@mui/material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import api from '../../services/api';
import CannedForm from './cannedForm';

const CannedEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch template data
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        
        // Get the tenant_id from localStorage
        const tenantId = localStorage.getItem('tenant_id');
        
        if (!tenantId) {
          message.error('Tenant information not found. Please log in again.');
          navigate('/login');
          return;
        }
        
        // Fetch template by ID
        const response = await api.get(`canned-messages/${id}/`, {
          headers: {
            'X-Tenant-ID': tenantId
          }
        });
        
        // Check if the template belongs to this tenant
        if (response.data && response.data.tenant_id === tenantId) {
          setTemplate(response.data);
        } else {
          throw new Error('Template not found or not authorized');
        }
      } catch (error) {
        // Handle not found or unauthorized errors
        setError('Template not found or you do not have permission to edit it.');
        message.error('Template not found or not authorized');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplate();
  }, [id, navigate]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setSubmitting(true);
    
    try {
      // Get the tenant ID from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      
      if (!tenantId) {
        throw new Error('Tenant information not found');
      }
      
      // Submit data to the API
      await api.put(`canned-messages/${id}/`, formData, {
        headers: {
          'X-Tenant-ID': tenantId
        }
      });
      
      return true;
    } catch (error) {
      // Rethrow for the form component to handle errors
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ pt: 2, pb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Show error message if template not found
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <MuiLink component={Link} to="/dashboard" color="inherit">
              Dashboard
            </MuiLink>
            <MuiLink component={Link} to="/dashboard/canned-messages" color="inherit">
              Canned Messages
            </MuiLink>
            <Typography color="text.primary">Edit Template</Typography>
          </Breadcrumbs>
        </Box>
        
        <Typography variant="h6" color="error" sx={{ my: 4, textAlign: 'center' }}>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      {/* Breadcrumbs navigation */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MuiLink component={Link} to="/dashboard" color="inherit">
            Dashboard
          </MuiLink>
          <MuiLink component={Link} to="/dashboard/canned-messages" color="inherit">
            Canned Messages
          </MuiLink>
          <Typography color="text.primary">Edit Template</Typography>
        </Breadcrumbs>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8} lg={6}>
          {template && (
            <CannedForm 
              initialData={template} 
              onSubmit={handleSubmit} 
              isEditing={true} 
            />
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default CannedEdit;
