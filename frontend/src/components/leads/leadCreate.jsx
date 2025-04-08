import React, { useState, useEffect } from 'react';
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
  const [initialData, setInitialData] = useState({ branch: null });
  
  // Get default lead type based on user's industry
  useEffect(() => {
    const getUserIndustry = () => {
      try {
        // Try multiple possible localStorage keys for industry
        const directIndustry = localStorage.getItem('industry') ||
                             localStorage.getItem('user_industry') ||
                             '';
        
        // Get the full user object to see what's actually stored
        const userStr = localStorage.getItem('user');
        let userObj = null;
        
        try {
          if (userStr) {
            userObj = JSON.parse(userStr);
            console.log('LeadCreate - Full user object from localStorage:', userObj);
          }
        } catch (err) {
          console.error('LeadCreate - Error parsing user from localStorage:', err);
        }
        
        // Check if industry is available in the user object
        const userIndustry = userObj?.industry || '';
        // Also check for userData.industry which appears in the screenshot
        const userData = userObj?.userData || {};
        const userDataIndustry = (userData && userData.industry) ? userData.industry : '';
        
        console.log('LeadCreate - User industry from direct localStorage key:', directIndustry);
        console.log('LeadCreate - User industry from user object:', userIndustry);
        console.log('LeadCreate - User industry from userData object:', userDataIndustry);
        
        // Use the first available industry value
        const effectiveIndustry = userDataIndustry || userIndustry || directIndustry || '';
        console.log('LeadCreate - Effective industry being used:', effectiveIndustry);
        
        // Also log all localStorage keys for debugging
        console.log('LeadCreate - All localStorage keys:');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          try {
            console.log(`${key}: ${localStorage.getItem(key)}`);
          } catch (e) {
            console.log(`Error reading localStorage key ${key}:`, e);
          }
        }
        
        // Set default lead type based on industry
        let defaultLeadType = 'hajj_package'; // Default
        
        // Convert to lowercase and remove quotes for comparison
        const normalizedIndustry = effectiveIndustry ? effectiveIndustry.toLowerCase().replace(/"/g, '') : '';
        console.log('LeadCreate - Normalized industry for comparison:', normalizedIndustry);
        
        switch(normalizedIndustry) {
          case 'hajj_umrah':
            defaultLeadType = 'hajj_package';
            break;
          case 'immigration':
            defaultLeadType = 'study_visa';
            break;
          case 'travel_tourism':
            defaultLeadType = 'travel_package';
            break;
          default:
            console.log(`LeadCreate - Unknown industry: "${effectiveIndustry}". Defaulting to hajj_package.`);
            // Keep the default
            break;
        }
        
        console.log(`LeadCreate - Setting default lead type to ${defaultLeadType} based on industry ${effectiveIndustry}`);
        
        // Set initial data with the appropriate default lead type
        setInitialData({
          branch: null,
          lead_type: defaultLeadType
        });
      } catch (error) {
        console.error('LeadCreate - Error in getUserIndustry:', error);
        // Set default initial data as fallback
        setInitialData({
          branch: null,
          lead_type: 'hajj_package'
        });
      }
    };
    
    getUserIndustry();
  }, []);
  
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
        initialData={initialData}
      />
    </Container>
  );
};

export default LeadCreate;
