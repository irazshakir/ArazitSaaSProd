import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Typography, Card, Alert, Form, Checkbox, Spin } from 'antd';
import api from '../../../../services/api';
import { API_BASE_URL, API_ENDPOINTS } from '../../../../config/api';

// Common form components
import FormTextInput from '../../common/formTextInput';
import FormTextarea from '../../common/formTextarea';
import FormSelect from '../../common/formSelect';
import FormNumberInput from '../../common/formNumberInput';
import FormSection from '../../common/formSection';

// Utilities
import useFormValidation from '../../common/useFormValidation';

/**
 * Form component for creating and editing Study Visa inquiries
 * @param {object} initialData - Initial inquiry data (for editing)
 * @param {boolean} isEditMode - Whether the form is in edit mode
 * @param {function} onSuccess - Function to call after successful form submission
 */
const StudyVisaForm = ({ 
  initialData = {},
  isEditMode = false,
  onSuccess
}) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Country and qualification options based on the models.py
  const qualificationOptions = [
    { value: 'phd', label: 'PhD' },
    { value: 'phil', label: 'Phil' },
    { value: 'msc', label: 'MSc' },
    { value: 'ma', label: 'MA' },
    { value: 'mcom', label: 'MCom' },
    { value: 'mcs', label: 'MCS' },
    { value: 'mbbs', label: 'MBBS' },
    { value: 'bsc', label: 'BSc' },
    { value: 'ba', label: 'BA' },
    { value: 'bcs', label: 'BCS' },
    { value: 'bsit', label: 'BSIT' },
    { value: 'bcom', label: 'BCom' },
    { value: 'ca', label: 'CA' },
    { value: 'fa', label: 'FA' },
    { value: 'fsc', label: 'FSc' },
    { value: 'metric', label: 'Metric' },
    { value: 'other', label: 'Other' }
  ];

  const countryOptions = [
    { value: 'usa', label: 'USA' },
    { value: 'canada', label: 'Canada' },
    { value: 'uk', label: 'UK' },
    { value: 'italy', label: 'Italy' },
    { value: 'france', label: 'France' },
    { value: 'sweden', label: 'Sweden' },
    { value: 'china', label: 'China' },
    { value: 'turkey', label: 'Turkey' },
    { value: 'malaysia', label: 'Malaysia' },
    { value: 'australia', label: 'Australia' },
    { value: 'new_zealand', label: 'New Zealand' },
    { value: 'other', label: 'Other' }
  ];

  const ieltsOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'not_required', label: 'Not Required' }
  ];

  const educationalOptions = [
    { value: 'completed', label: 'Completed' },
    { value: 'not_completed', label: 'Not Completed' },
    { value: 'not_required', label: 'Not Required' }
  ];

  const assessmentOptions = [
    { value: 'eligible', label: 'Eligible' },
    { value: 'not_eligible', label: 'Not Eligible' }
  ];

  // Prepare initial form values
  const getInitialValues = () => {
    // Extract eligibility and cost data if available
    const eligibility = initialData?.eligibility || {};
    const cost = initialData?.cost || {};
    
    return {
      // Study Inquiry fields
      last_qualification: initialData.last_qualification || '',
      country: initialData.country || '',
      notes: initialData.notes || '',
      
      // Study Eligibility fields
      manage_bankstatement: eligibility.manage_bankstatement || false,
      required_ielts: eligibility.required_ielts || 'yes',
      educational_requirements: eligibility.educational_requirements || 'not_completed',
      final_assessment: eligibility.final_assessment || 'not_eligible',
      eligibility_note: eligibility.note || '',
      
      // Study Cost fields
      consultation_cost: cost.consultation_cost || 0,
      uni_rebate: cost.uni_rebate || 0
    };
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
    getInitialValues(),
    {
      // Add validation rules as needed
      last_qualification: { required: true },
      country: { required: true }
    }
  );

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Get authentication token
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Get user and tenant information for creating entities
      const userInfo = localStorage.getItem('user');
      let userId = null;
      let tenantId = localStorage.getItem('tenant_id') || 
                   sessionStorage.getItem('tenant_id');
      
      if (userInfo) {
        try {
          const parsedUser = JSON.parse(userInfo);
          userId = parsedUser.id;
          
          // If tenant ID is not set yet, try to get from user object
          if (!tenantId) {
            tenantId = parsedUser.tenant_id || parsedUser.tenant;
          }
        } catch (e) {
          console.error('Error parsing user info:', e);
        }
      }

      // Prepare the data for submission
      const formData = {
        // Study Inquiry fields
        last_qualification: values.last_qualification,
        country: values.country,
        notes: values.notes,
        
        // If we're creating a new entry, we need to include lead ID
        ...(isEditMode ? {} : { lead_inquiry: initialData.lead_id }),
        
        // Nested eligibility data
        eligibility: {
          manage_bankstatement: values.manage_bankstatement,
          required_ielts: values.required_ielts,
          educational_requirements: values.educational_requirements,
          final_assessment: values.final_assessment,
          note: values.eligibility_note
        },
        
        // Nested cost data
        cost: {
          consultation_cost: parseFloat(values.consultation_cost) || 0,
          uni_rebate: parseFloat(values.uni_rebate) || 0
        },
        
        // Additional metadata
        tenant: tenantId,
        created_by: userId,
      };

      // Make API request
      let response;
      if (isEditMode) {
        response = await api.put(`/study-visas/${initialData.id}/`, formData);
      } else {
        response = await api.post('/study-visas/', formData);
      }

      // Success - reset form and call success callback
      if (!isEditMode) resetForm();
      
      if (typeof onSuccess === 'function') {
        onSuccess(response.data);
      }
    } catch (error) {
      let errorMessage = 'An error occurred while saving the study visa inquiry';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          errorMessage = Object.entries(error.response.data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="study-visa-form">
      {error && (
        <Alert
          message="Error"
          description={<div><p>{error}</p></div>}
          type="error" 
          showIcon 
          style={{ marginBottom: 24 }}
        />
      )}
      
      <Form
        form={form}
        layout="vertical"
        initialValues={getInitialValues()}
        name="study_visa_form"
      >
        <Row gutter={24}>
          {/* Main Form */}
          <Col xs={24}>
            {/* Basic Information Section */}
            <FormSection title="Basic Information">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <FormSelect
                    label="Last Qualification"
                    name="last_qualification"
                    value={values.last_qualification}
                    onChange={(value) => handleChange('last_qualification', value)}
                    onBlur={() => handleBlur('last_qualification')}
                    error={touched.last_qualification && errors.last_qualification}
                    options={qualificationOptions}
                    required
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormSelect
                    label="Destination Country"
                    name="country"
                    value={values.country}
                    onChange={(value) => handleChange('country', value)}
                    onBlur={() => handleBlur('country')}
                    error={touched.country && errors.country}
                    options={countryOptions}
                    required
                  />
                </Col>
                <Col xs={24}>
                  <FormTextarea
                    label="Notes"
                    name="notes"
                    value={values.notes}
                    onChange={(value) => handleChange('notes', value)}
                    rows={4}
                  />
                </Col>
              </Row>
            </FormSection>
            
            {/* Eligibility Section */}
            <FormSection title="Eligibility Assessment">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Bank Statement"
                    name="manage_bankstatement"
                    valuePropName="checked"
                  >
                    <Checkbox
                      checked={values.manage_bankstatement}
                      onChange={(e) => handleChange('manage_bankstatement', e.target.checked)}
                    >
                      Can Manage Bank Statement
                    </Checkbox>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <FormSelect
                    label="IELTS Requirement"
                    name="required_ielts"
                    value={values.required_ielts}
                    onChange={(value) => handleChange('required_ielts', value)}
                    options={ieltsOptions}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormSelect
                    label="Educational Requirements"
                    name="educational_requirements"
                    value={values.educational_requirements}
                    onChange={(value) => handleChange('educational_requirements', value)}
                    options={educationalOptions}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormSelect
                    label="Final Assessment"
                    name="final_assessment"
                    value={values.final_assessment}
                    onChange={(value) => handleChange('final_assessment', value)}
                    options={assessmentOptions}
                  />
                </Col>
                <Col xs={24}>
                  <FormTextarea
                    label="Eligibility Notes"
                    name="eligibility_note"
                    value={values.eligibility_note}
                    onChange={(value) => handleChange('eligibility_note', value)}
                    rows={4}
                  />
                </Col>
              </Row>
            </FormSection>
            
            {/* Cost Section */}
            <FormSection title="Cost Details">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <FormNumberInput
                    label="Consultation Cost"
                    name="consultation_cost"
                    value={values.consultation_cost}
                    onChange={(value) => handleChange('consultation_cost', value)}
                    min={0}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormNumberInput
                    label="University Rebate"
                    name="uni_rebate"
                    value={values.uni_rebate}
                    onChange={(value) => handleChange('uni_rebate', value)}
                    min={0}
                  />
                </Col>
              </Row>
            </FormSection>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default StudyVisaForm;
