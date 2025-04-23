import React from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GeneralProductForm from './generalProductForm';

const GeneralProductCreate = () => {
  const navigate = useNavigate();

  // Handle successful form submission
  const handleSuccess = () => {
    navigate('/dashboard/general-products');
  };

  return (
    <Box>
      <GeneralProductForm 
        isEditMode={false}
        onSuccess={handleSuccess}
      />
    </Box>
  );
};

export default GeneralProductCreate;
