import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import DevelopmentProjectForm from './developmentProjectForm';

/**
 * Container component for creating new Development Projects
 */
const DevelopmentProjectCreate = () => {
  const navigate = useNavigate();
  
  // Handle successful form submission
  const handleSuccess = () => {
    alert('Development project created successfully!');
    navigate('/dashboard/real-estate/development-projects');
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
            title: <span onClick={() => navigate('/dashboard/real-estate/development-projects')} style={{ cursor: 'pointer' }}>Development Projects</span>,
          },
          {
            title: 'Create',
          },
        ]}
      />
      
      <Typography.Title level={3} style={{ marginBottom: '24px' }}>
        Create Development Project
      </Typography.Title>
      
      <DevelopmentProjectForm 
        isEditMode={false}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default DevelopmentProjectCreate;
