import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Spin, Alert, Space, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import api from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api';
import DevelopmentProjectForm from './developmentProjectForm';

/**
 * Container component for editing existing Development Projects
 */
const DevelopmentProjectEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await api.get(API_ENDPOINTS.DEVELOPMENT_PROJECTS.DETAIL(id));
        setProjectData(response.data);
      } catch (err) {
        setError('Failed to load project details. Please try again.');
        console.error('Error fetching project data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchProject();
    }
  }, [id]);
  
  // Handle successful form submission
  const handleSuccess = () => {
    alert('Development project updated successfully!');
    navigate('/dashboard/real-estate/development-projects');
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
              <button type="button" onClick={() => navigate('/dashboard/real-estate/development-projects')}>
                Back to Development Projects
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
            title: <span onClick={() => navigate('/dashboard/real-estate/development-projects')} style={{ cursor: 'pointer' }}>Development Projects</span>,
          },
          {
            title: `Edit: ${projectData?.project_name || 'Project'}`,
          },
        ]}
      />
      
      <Typography.Title level={3} style={{ marginBottom: '24px' }}>
        Edit Development Project: {projectData?.project_name}
      </Typography.Title>
      
      {projectData && (
        <DevelopmentProjectForm 
          initialData={projectData}
          isEditMode={true}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default DevelopmentProjectEdit;
