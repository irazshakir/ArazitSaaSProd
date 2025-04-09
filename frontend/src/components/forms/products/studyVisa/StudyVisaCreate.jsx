import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import StudyVisaForm from './StudyVisaForm';

/**
 * Container component for creating new Study Visa inquiries
 */
const StudyVisaCreate = () => {
  const navigate = useNavigate();
  
  // Handle successful form submission
  const handleSuccess = () => {
    alert('Study visa inquiry created successfully!');
    navigate('/dashboard/immigration/study-visas');
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
            title: <span onClick={() => navigate('/dashboard/immigration/study-visas')} style={{ cursor: 'pointer' }}>Study Visas</span>,
          },
          {
            title: 'Create',
          },
        ]}
      />
      
      <Typography.Title level={3} style={{ marginBottom: '24px' }}>
        Create Study Visa Inquiry
      </Typography.Title>
      
      <StudyVisaForm 
        isEditMode={false}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default StudyVisaCreate;
