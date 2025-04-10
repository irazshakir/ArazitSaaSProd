import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Breadcrumb, Spin, Alert, Space } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Box, Container, Paper } from '@mui/material';
import api from '../../services/api';
import LeadForm from './leadForm';
import dayjs from 'dayjs';

/**
 * Component for editing existing leads
 */
const LeadEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch lead data
  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/leads/${id}/`);
        
        // Process study visa data if present
        let processedData = {
          ...response.data,
          // Convert date fields to dayjs objects
          last_contacted: response.data.last_contacted ? dayjs(response.data.last_contacted) : null,
          next_follow_up: response.data.next_follow_up ? dayjs(response.data.next_follow_up) : null,
          // Preserve branch information
          branch: response.data.branch || null
        };
        
        setLeadData(processedData);
        setLoading(false);
      } catch (error) {
        setError('Failed to load lead details. Please try again.');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchLeadData();
    }
  }, [id]);
  
  // Handle successful form submission
  const handleSuccess = () => {
    // Show success message and redirect
    navigate('/dashboard/leads');
  };
  
  // Show loading state
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Spin size="large" />
        </Box>
      </Container>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Space>
              <button type="button" onClick={() => navigate('/dashboard/leads')}>
                Back to Leads
              </button>
            </Space>
          }
        />
      </Container>
    );
  }
  
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
            title: `Edit: ${leadData?.name || 'Lead'}`,
          },
        ]}
      />
      
      <Typography.Title level={3} style={{ marginBottom: '24px' }}>
        Edit Lead: {leadData?.name}
      </Typography.Title>
      
      {leadData && (
        <LeadForm 
          initialData={leadData}
          isEditMode={true}
          onSuccess={handleSuccess}
        />
      )}
    </Container>
  );
};

export default LeadEdit;
