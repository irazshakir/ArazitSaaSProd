import React, { useState } from 'react';
import { Container, Grid, Typography, Box, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';
import { message } from 'antd';
import api from '../../services/api';
import CannedForm from './cannedForm';

const CannedCreate = () => {
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    
    try {
      // Get the tenant ID from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      
      if (!tenantId) {
        throw new Error('Tenant information not found');
      }
      
      // Submit data to the API
      await api.post('canned-messages/', formData, {
        headers: {
          'X-Tenant-ID': tenantId
        }
      });
      
      return true;
    } catch (error) {
      // Rethrow for the form component to handle errors
      throw error;
    } finally {
      setLoading(false);
    }
  };

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
          <Typography color="text.primary">Create New Template</Typography>
        </Breadcrumbs>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8} lg={6}>
          <CannedForm onSubmit={handleSubmit} isEditing={false} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default CannedCreate;
