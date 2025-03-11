import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Spin, Alert, Space, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import api from '../../../../services/api';
import HajjPackageForm from './HajjPackageForm';

/**
 * Container component for editing existing Hajj packages
 */
const HajjPackageEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch package data
  useEffect(() => {
    const fetchPackage = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/hajj-packages/${id}/`);
        setPackageData(response.data);
      } catch (err) {
        console.error('Error fetching package details:', err);
        setError('Failed to load package details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchPackage();
    }
  }, [id]);
  
  // Handle successful form submission
  const handleSuccess = () => {
    // Show success message and redirect
    alert('Hajj package updated successfully!');
    navigate('/dashboard/hajj-umrah/hajj-packages');
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
              <button type="button" onClick={() => navigate('/dashboard/hajj-umrah/hajj-packages')}>
                Back to Hajj Packages
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
            title: <span onClick={() => navigate('/dashboard/hajj-umrah/hajj-packages')} style={{ cursor: 'pointer' }}>Hajj Packages</span>,
          },
          {
            title: `Edit: ${packageData?.package_name || 'Package'}`,
          },
        ]}
      />
      
      <Typography.Title level={3} style={{ marginBottom: '24px' }}>
        Edit Hajj Package: {packageData?.package_name}
      </Typography.Title>
      
      {packageData && (
        <HajjPackageForm 
          initialData={packageData}
          isEditMode={true}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default HajjPackageEdit; 