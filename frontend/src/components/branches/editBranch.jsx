import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';
import { message } from 'antd';
import api from '../../services/api';
import BranchForm from './branchForm';

const EditBranch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch branch data
  useEffect(() => {
    const fetchBranch = async () => {
      try {
        setLoading(true);
        
        // Try 3 different API endpoints in sequence
        let response = null;
        let errorMessages = [];
        
        // Try main endpoint first
        try {
          response = await api.get(`branches/${id}/`);
        } catch (error) {
          errorMessages.push(`Main endpoint error: ${error.message}`);
          
          // Try auth endpoint next
          try {
            response = await api.get(`auth/branches/${id}/`);
          } catch (error2) {
            errorMessages.push(`Auth endpoint error: ${error2.message}`);
            
            // Try users endpoint as last resort
            try {
              response = await api.get(`users/branches/${id}/`);
            } catch (error3) {
              errorMessages.push(`Users endpoint error: ${error3.message}`);
              throw new Error(`All API attempts failed: ${errorMessages.join(', ')}`);
            }
          }
        }
        
        if (!response) {
          throw new Error('No valid response from any API endpoint');
        }
        
        setBranch(response.data);
        setLoading(false);
      } catch (error) {
        setError('Failed to load branch data. Please try again.');
        setLoading(false);
      }
    };

    fetchBranch();
  }, [id]);

  // Handle successful form submission
  const handleSuccess = () => {
    message.success('Branch updated successfully!');
    navigate('/dashboard/branches');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!branch) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">Branch not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <BranchForm 
        initialData={branch}
        isEditMode={true}
        onSuccess={handleSuccess}
      />
    </Box>
  );
};

export default EditBranch; 