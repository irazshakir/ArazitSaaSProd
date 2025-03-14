import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Container } from '@mui/material';
import LeadForm from './leadForm';

/**
 * Component for creating new leads
 */
const LeadCreate = () => {
  const navigate = useNavigate();
  
  // Handle successful form submission
  const handleSuccess = () => {
    navigate('/dashboard/leads');
  };
  
  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumb 
        style={{ marginBottom: '16px' }}
        items={[
          {
            title: <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}><HomeOutlined /> Dashboard</span>,
          },
          {
            title: <span onClick={() => navigate('/dashboard/leads')} style={{ cursor: 'pointer' }}>Leads</span>,
          },
          {
            title: 'Create',
          },
        ]}
      />
      
      <Typography.Title level={3} style={{ marginBottom: '24px' }}>
        Create New Lead
      </Typography.Title>
      
      <LeadForm 
        isEditMode={false}
        onSuccess={handleSuccess}
      />
    </Container>
  );
};

export default LeadCreate;
