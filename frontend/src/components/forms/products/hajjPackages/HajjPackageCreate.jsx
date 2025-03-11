import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography } from 'antd';
import HajjPackageForm from './HajjPackageForm';

/**
 * Container component for creating new Hajj packages
 */
const HajjPackageCreate = () => {
  const navigate = useNavigate();
  
  // Handle successful form submission
  const handleSuccess = () => {
    console.log('HajjPackageCreate: Form submitted successfully');
    // Show success message and redirect
    alert('Hajj package created successfully!');
    console.log('HajjPackageCreate: Navigating to package list');
    navigate('/dashboard/hajj-umrah/hajj-packages');
  };
  
  return (
    <div style={{ padding: '24px' }}>
      <Typography.Title level={3} style={{ marginBottom: '24px' }}>
        Create Hajj Package
      </Typography.Title>
      
      <HajjPackageForm 
        isEditMode={false}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default HajjPackageCreate; 