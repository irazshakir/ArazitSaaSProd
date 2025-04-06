import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import UmrahPackageForm from './umrahPackageForm';

/**
 * Container component for creating new Umrah packages
 */
const UmrahPackageCreate = () => {
  const navigate = useNavigate();
  
  // Handle successful form submission
  const handleSuccess = () => {
    alert('Umrah package created successfully!');
    navigate('/dashboard/hajj-umrah/umrah-packages');
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
            title: <span onClick={() => navigate('/dashboard/hajj-umrah/umrah-packages')} style={{ cursor: 'pointer' }}>Umrah Packages</span>,
          },
          {
            title: 'Create',
          },
        ]}
      />
      
      <Typography.Title level={3} style={{ marginBottom: '24px' }}>
        Create Umrah Package
      </Typography.Title>
      
      <UmrahPackageForm 
        isEditMode={false}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default UmrahPackageCreate; 