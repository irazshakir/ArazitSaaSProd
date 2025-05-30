import React from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DepartmentForm from './departmentForm';

const CreateDepartment = () => {
  const navigate = useNavigate();

  // Handle successful form submission
  const handleSuccess = () => {
    navigate('/dashboard/departments');
  };

  return (
    <Box>
      <DepartmentForm 
        isEditMode={false}
        onSuccess={handleSuccess}
      />
    </Box>
  );
};

export default CreateDepartment; 