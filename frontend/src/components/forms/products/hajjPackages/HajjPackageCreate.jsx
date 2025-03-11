import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import HajjPackageForm from './HajjPackageForm';

/**
 * Container component for creating new Hajj packages
 */
const HajjPackageCreate = () => {
  const navigate = useNavigate();
  
  // Handle successful form submission
  const handleSuccess = () => {
    alert('Hajj package created successfully!');
    navigate('/dashboard/hajj-umrah/hajj-packages');
  };
  
  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumb 
        style={{ marginBottom: '16px' }}
        items={[
          {
            title: <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}><HomeOutlined /> Dashboard</span>,
          },
          {
            title: <span onClick={() => navigate('/dashboard/hajj-umrah/hajj-packages')} style={{ cursor: 'pointer' }}>Hajj Packages</span>,
          },
          {
            title: 'Create',
          },
        ]}
      />
      
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