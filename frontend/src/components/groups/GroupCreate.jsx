import React, { useState } from 'react';
import { Container, Typography, Paper, Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import api from '../../services/api';
import { GroupForm } from './groupForm';

export const GroupCreate = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      const tenantId = localStorage.getItem('tenant_id');
      
      // Format the data for the API
      const groupData = {
        name: formData.name,
        members: formData.client_ids, // Send selected client IDs as members
        status: formData.status,
        tenant: tenantId,
        members_count: formData.client_ids.length // Add members count
      };

      console.log('Creating group with data:', groupData);
      
      const response = await api.post('groups/', groupData);

      message.success('Group created successfully');
      // Short delay before navigating to ensure the success message is seen
      setTimeout(() => {
        navigate('/dashboard/groups');
      }, 1000);
    } catch (error) {
      console.error('Error creating group:', error);
      let errorMessage = 'Failed to create group. Please try again.';
      
      // Extract error message from response if available
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      message.error(errorMessage);
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/groups');
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: 'white'
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
            Create New Group
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create a new group by filling out the form below.
          </Typography>
        </Box>
        
        {submitting ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#9d277c' }} />
          </Box>
        ) : (
          <GroupForm 
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </Paper>
    </Container>
  );
};
