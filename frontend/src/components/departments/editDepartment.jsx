import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';
import { message } from 'antd';
import api from '../../services/api';
import DepartmentForm from './departmentForm';

const EditDepartment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch department data
  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setLoading(true);
        
        // Try multiple endpoints
        const endpoints = [
          `departments/${id}/`,
          `users/departments/${id}/`,
          `auth/departments/${id}/`
        ];
        
        let response = null;
        let lastError = null;
        
        for (const endpoint of endpoints) {
          try {
            response = await api.get(endpoint);
            break;
          } catch (error) {
            console.error(`Failed to fetch from ${endpoint}:`, error);
            lastError = error;
          }
        }
        
        if (!response) {
          throw lastError || new Error('Failed to fetch department data');
        }
        
        setDepartment(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching department:', error);
        setError('Failed to load department data. Please try again.');
        setLoading(false);
      }
    };

    fetchDepartment();
  }, [id]);

  // Handle successful form submission
  const handleSuccess = () => {
    message.success('Department updated successfully!');
    navigate('/dashboard/departments');
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

  if (!department) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">Department not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <DepartmentForm 
        initialData={department}
        isEditMode={true}
        onSuccess={handleSuccess}
      />
    </Box>
  );
};

export default EditDepartment; 