import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Typography, Card, Alert, Affix, Space, Button, Spin, Form } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import api from '../../../../services/api';
import { API_BASE_URL, API_ENDPOINTS } from '../../../../config/api';

// Common form components
import FormTextInput from '../../common/formTextInput';
import FormTextarea from '../../common/formTextarea';
import FormSelect from '../../common/formSelect';
import FormNumberInput from '../../common/formNumberInput';
import FormDatePicker from '../../common/formDatePicker';
import FormSection from '../../common/formSection';
import FormActions from '../../common/formActions';
import UploadIcon from '../../common/uploadIcon';

// Utilities
import useFormValidation from '../../common/useFormValidation';

/**
 * Form component for creating and editing Development Projects
 * @param {object} initialData - Initial project data (for editing)
 * @param {boolean} isEditMode - Whether the form is in edit mode
 * @param {function} onSuccess - Function to call after successful form submission
 */
const DevelopmentProjectForm = ({ 
  initialData = {},
  isEditMode = false,
  onSuccess
}) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectImage, setProjectImage] = useState(
    initialData?.project_image ? [
      {
        uid: '-1',
        name: initialData.project_image.split('/').pop() || 'project-image.jpg',
        status: 'done',
        url: initialData.project_image.startsWith('http') 
          ? initialData.project_image 
          : `${API_BASE_URL}${initialData.project_image}`
      }
    ] : []
  );
  
  // Define options for select fields based on model choices
  const options = {
    propertyType: [
      { value: 'residential', label: 'Residential' },
      { value: 'commercial', label: 'Commercial' }
    ],
    listingType: [
      { value: 'house', label: 'House' },
      { value: 'flat', label: 'Flat' },
      { value: 'shop', label: 'Shop' },
      { value: 'building', label: 'Building' },
      { value: 'farmhouse', label: 'Farmhouse' },
      { value: 'plot', label: 'Plot' }
    ]
  };
  
  // Initialize form with validation
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setValues,
    setFieldValue
  } = useFormValidation(
    {
      project_name: initialData?.project_name || '',
      property_type: initialData?.property_type || 'residential',
      listing_type: initialData?.listing_type || 'house',
      location: initialData?.location || '',
      covered_size: initialData?.covered_size || '',
      features: initialData?.features || '',
      project_image: initialData?.project_image || null
    },
    {
      project_name: (value) => !value ? 'Project name is required' : null,
      property_type: (value) => !value ? 'Property type is required' : null,
      listing_type: (value) => !value ? 'Listing type is required' : null,
      location: (value) => !value ? 'Location is required' : null,
      covered_size: (value) => !value ? 'Covered size is required' : null
    }
  );

  // Handle image change
  const handleImageChange = (fileList) => {
    setProjectImage(fileList);
    
    // Update the values state with the image file
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      // Store the file in the form values
      setFieldValue('project_image', file);
    } else {
      setFieldValue('project_image', null);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Get current user info from localStorage
      const userInfo = localStorage.getItem('user');
      let userId = null;
      let tenantId = null;
      
      // Try to get tenant_id from localStorage or sessionStorage
      tenantId = localStorage.getItem('tenant_id') || sessionStorage.getItem('tenant_id');
      
      let parsedUser = null;
      try {
        if (userInfo) {
          parsedUser = JSON.parse(userInfo);
          userId = parsedUser.id;
          
          // If tenantId is not set yet, try to get it from user object
          if (!tenantId) {
            tenantId = parsedUser.tenant_id || parsedUser.tenant;
          }
        }
      } catch (e) {
        // Error parsing user info
      }

      // If we still don't have a valid tenant ID, show error
      if (!tenantId) {
        throw new Error('Unable to determine your tenant ID. Please contact your administrator.');
      }

      // Create a FormData object for file upload
      const formData = new FormData();
      
      // Add all form fields to FormData
      const formFields = {
        tenant_id: tenantId,
        project_name: values.project_name,
        property_type: values.property_type,
        listing_type: values.listing_type,
        location: values.location,
        covered_size: values.covered_size,
        features: values.features,
      };
      
      // Add all field values to FormData
      Object.entries(formFields).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });
      
      // Add image if available
      if (projectImage.length > 0 && projectImage[0].originFileObj) {
        formData.append('project_image', projectImage[0].originFileObj);
      }
      
      // Get the auth token
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      // Prepare the API endpoint for development projects
      const endpoint = isEditMode 
        ? API_ENDPOINTS.DEVELOPMENT_PROJECTS.DETAIL(initialData.id)
        : API_ENDPOINTS.DEVELOPMENT_PROJECTS.LIST;
      
      // Make the API request
      let response;
      if (isEditMode) {
        response = await api.put(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        response = await api.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      // Success!
      if (!isEditMode) resetForm();
      
      if (typeof onSuccess === 'function') {
        onSuccess(response.data);
      }
    } catch (error) {
      let errorMessage = 'An error occurred while saving the project';
      
      if (error.response) {
        if (error.response.data) {
          if (typeof error.response.data === 'object') {
            errorMessage = Object.entries(error.response.data)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('\n');
          } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form cancel
  const handleCancel = () => {
    navigate('/dashboard/real-estate/development-projects');
  };
  
  return (
    <div className="development-project-form">
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error" 
          showIcon 
          style={{ marginBottom: 24 }}
        />
      )}
      
      <Form
        form={form}
        layout="vertical"
        initialValues={initialData}
        name="development_project_form"
      >
        <Row gutter={24}>
          {/* Left Container - Main Form */}
          <Col xs={24} lg={16}>
            {/* Basic Information Section */}
            <FormSection title="Project Information">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <FormTextInput
                    label="Project Name"
                    name="project_name"
                    value={values.project_name}
                    onChange={(value) => handleChange('project_name', value)}
                    onBlur={() => handleBlur('project_name')}
                    error={touched.project_name && errors.project_name}
                    required
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormSelect
                    label="Property Type"
                    name="property_type"
                    value={values.property_type}
                    onChange={(value) => handleChange('property_type', value)}
                    onBlur={() => handleBlur('property_type')}
                    error={touched.property_type && errors.property_type}
                    options={options.propertyType}
                    required
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormSelect
                    label="Listing Type"
                    name="listing_type"
                    value={values.listing_type}
                    onChange={(value) => handleChange('listing_type', value)}
                    onBlur={() => handleBlur('listing_type')}
                    error={touched.listing_type && errors.listing_type}
                    options={options.listingType}
                    required
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormTextInput
                    label="Location"
                    name="location"
                    value={values.location}
                    onChange={(value) => handleChange('location', value)}
                    onBlur={() => handleBlur('location')}
                    error={touched.location && errors.location}
                    required
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormTextInput
                    label="Covered Size"
                    name="covered_size"
                    value={values.covered_size}
                    onChange={(value) => handleChange('covered_size', value)}
                    onBlur={() => handleBlur('covered_size')}
                    error={touched.covered_size && errors.covered_size}
                    required
                    placeholder="e.g. 1500 sq ft"
                  />
                </Col>
              </Row>
            </FormSection>
            
            {/* Features Section */}
            <FormSection title="Features and Description">
              <Row gutter={16}>
                <Col xs={24}>
                  <FormTextarea
                    label="Features"
                    name="features"
                    value={values.features}
                    onChange={(value) => handleChange('features', value)}
                    placeholder="Describe the features and amenities of this development project"
                    rows={6}
                  />
                </Col>
              </Row>
            </FormSection>
          </Col>
          
          {/* Right Container - Sidebar */}
          <Col xs={24} lg={8}>
            {/* Project Image Upload */}
            <UploadIcon
              title="Project Image"
              accept="image/*"
              maxCount={1}
              buttonText="Upload Image"
              onChange={handleImageChange}
              fileList={projectImage}
              initialValue={initialData?.project_image ? [
                {
                  uid: '-1',
                  name: initialData.project_image.split('/').pop() || 'project-image.jpg',
                  status: 'done',
                  url: initialData.project_image.startsWith('http') 
                    ? initialData.project_image 
                    : `${API_BASE_URL}${initialData.project_image}`
                }
              ] : []}
            />
            
            {/* Additional Information Card */}
            <Card title="Additional Information" style={{ marginBottom: 24 }}>
              <p>Upload high-quality images of the development project to attract potential leads.</p>
              <p>Provide detailed features to highlight the unique aspects of this property.</p>
            </Card>
          </Col>
        </Row>
      </Form>
      
      {/* Fixed Action Buttons */}
      <Affix offsetBottom={0}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '16px 24px', 
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)', 
          zIndex: 999, 
          width: '100%',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          {/* Left side - Return button */}
          <div>
            <Button 
              onClick={() => navigate('/dashboard/real-estate/development-projects')} 
              type="default" 
              icon={<ArrowLeftOutlined />}
              style={{ marginRight: 8 }}
            >
              Back to List
            </Button>
          </div>
          
          {/* Right side - Form actions */}
          <div>
            <Button
              type="primary"
              onClick={handleSubmit}
              disabled={isLoading}
              icon={isLoading ? <Spin size="small" /> : <SaveOutlined />}
              style={{ backgroundColor: '#9d277c', borderColor: '#9d277c', marginLeft: 8 }}
            >
              {isLoading ? 'Saving...' : (isEditMode ? 'Update' : 'Create')}
            </Button>
            
            <Button
              type="default"
              onClick={handleCancel}
              disabled={isLoading}
              style={{ marginLeft: 8 }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Affix>
    </div>
  );
};

export default DevelopmentProjectForm;
