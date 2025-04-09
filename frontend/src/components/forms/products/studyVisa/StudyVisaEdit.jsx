import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Spin, Alert, Space, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import api from '../../../../services/api';
import StudyVisaForm from './StudyVisaForm';

/**
 * Container component for editing existing Study Visa inquiries
 */
const StudyVisaEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [studyVisaData, setStudyVisaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch study visa data
  useEffect(() => {
    const fetchStudyVisa = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/study-visas/${id}/`);
        setStudyVisaData(response.data);
      } catch (err) {
        setError('Failed to load study visa details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchStudyVisa();
    }
  }, [id]);
  
  // Handle successful form submission
  const handleSuccess = () => {
    // Show success message and redirect
    alert('Study visa inquiry updated successfully!');
    navigate('/dashboard/immigration/study-visas');
  };
  
  // Show loading state
  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Space>
              <button type="button" onClick={() => navigate('/dashboard/immigration/study-visas')}>
                Back to Study Visas
              </button>
            </Space>
          }
        />
      </div>
    );
  }
  
  // Show form with loaded data
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
            title: `Edit: ${studyVisaData?.lead_inquiry?.name || 'Study Visa Inquiry'}`,
          },
        ]}
      />
      
      <Typography.Title level={3} style={{ marginBottom: '24px' }}>
        Edit Study Visa Inquiry: {studyVisaData?.lead_inquiry?.name}
      </Typography.Title>
      
      {studyVisaData && (
        <StudyVisaForm 
          initialData={studyVisaData}
          isEditMode={true}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default StudyVisaEdit;
