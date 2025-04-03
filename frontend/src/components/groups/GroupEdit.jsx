import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, CircularProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { message } from 'antd';
import api from '../../services/api';
import { GroupForm } from './groupForm';

export const GroupEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true);
        const tenantId = localStorage.getItem('tenant_id');
        
        // For testing, if id matches our dummy group, return mock data
        if (id === '1') {
          // First, fetch some actual leads to use as members
          try {
            const leadsResponse = await api.get('leads/', { 
              params: { tenant: tenantId } 
            });
            
            let clientIds = [];
            if (leadsResponse.data && Array.isArray(leadsResponse.data)) {
              // Take first 12 leads if available
              clientIds = leadsResponse.data.slice(0, 12).map(lead => lead.id);
            } else if (leadsResponse.data?.results && Array.isArray(leadsResponse.data.results)) {
              // Take first 12 leads if available
              clientIds = leadsResponse.data.results.slice(0, 12).map(lead => lead.id);
            }

            const dummyGroup = {
              id: '1',
              name: '14 Days Turkey',
              client_ids: clientIds, // Use the fetched lead IDs
              members_count: 12,
              status: 'in process',
              tenant: tenantId
            };
            setGroup(dummyGroup);
          } catch (error) {
            console.error('Error fetching leads for dummy data:', error);
            // Fallback to empty client_ids if leads fetch fails
            const dummyGroup = {
              id: '1',
              name: '14 Days Turkey',
              client_ids: [],
              members_count: 12,
              status: 'in process',
              tenant: tenantId
            };
            setGroup(dummyGroup);
          }
          setLoading(false);
          return;
        }

        const response = await api.get(`groups/${id}/`);
        const groupData = response.data;
        
        // Transform the data to match the form structure
        setGroup({
          name: groupData.name,
          client_ids: groupData.members || [], // Assuming members array contains client IDs
          status: groupData.status,
          tenant: groupData.tenant
        });
      } catch (error) {
        console.error('Error fetching group:', error);
        message.error('Failed to load group data');
        navigate('/dashboard/groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [id, navigate]);

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
        members_count: formData.client_ids.length
      };

      console.log('Updating group with data:', groupData);
      
      const response = await api.put(`groups/${id}/`, groupData);

      message.success('Group updated successfully');
      // Short delay before navigating to ensure the success message is seen
      setTimeout(() => {
        navigate('/dashboard/groups');
      }, 1000);
    } catch (error) {
      console.error('Error updating group:', error);
      let errorMessage = 'Failed to update group. Please try again.';
      
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

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400
          }}
        >
          <CircularProgress sx={{ color: '#9d277c' }} />
        </Paper>
      </Container>
    );
  }

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
            Edit Group
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update the group information using the form below.
          </Typography>
        </Box>
        
        {submitting ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#9d277c' }} />
          </Box>
        ) : (
          <GroupForm 
            initialData={group}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </Paper>
    </Container>
  );
};
