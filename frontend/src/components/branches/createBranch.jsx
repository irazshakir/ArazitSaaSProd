import React from 'react';
import { Box, Typography } from '@mui/material';
import { Breadcrumb } from 'antd';
import { useNavigate } from 'react-router-dom';
import BranchForm from './branchForm';

const CreateBranch = () => {
  const navigate = useNavigate();

  // Handle successful form submission
  const handleSuccess = () => {
    navigate('/dashboard/branches');
  };

  return (
    <Box>
      <BranchForm 
        isEditMode={false}
        onSuccess={handleSuccess}
      />
    </Box>
  );
};

export default CreateBranch; 