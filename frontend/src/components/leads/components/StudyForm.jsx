import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Grid, Typography, Paper, Box } from '@mui/material';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col, Divider, Switch, message } from 'antd';
import dayjs from 'dayjs';
import api from '../../../services/api';

const { Option } = Select;
const { TextArea } = Input;

const StudyForm = forwardRef(function StudyForm({ form, formValues, handleInputChange, initialData, onSave }, ref) {
  const [loading, setLoading] = useState(false);
  const [existingStudy, setExistingStudy] = useState(null);
  
  // Save study data
  const saveStudyData = async () => {
    if (!formValues.study) return;
    
    try {
      setLoading(true);
      const studyData = {
        ...formValues.study,
        lead_inquiry: initialData?.lead_id
      };
      
      // Make sure lead_inquiry is properly set
      if (!studyData.lead_inquiry) {
        message.error("Missing lead ID. Please save the lead first.");
        throw new Error("Missing lead ID");
      }
      
      let response;
      if (existingStudy) {
        // Remove id field to avoid conflicts in PUT request
        const { id, ...dataWithoutId } = studyData;
        
        // Update existing study
        response = await api.put(`/study/${existingStudy.id}/`, dataWithoutId);
      } else {
        // Create new study
        response = await api.post('/study/create-for-lead/', studyData);
      }
      
      message.success("Study details saved successfully");
      setExistingStudy(response.data);
      
      // Update local form values with saved data including ID
      handleInputChange('study', {
        ...response.data
      });
      
      // Call parent's onSave callback if provided
      if (onSave) {
        onSave(response.data);
      }
      
      return response.data;
    } catch (error) {
      message.error(`Failed to save study details: ${error.response?.data?.detail || error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Expose saveStudyData directly
  useImperativeHandle(ref, () => ({
    saveStudyData
  }));
  
  // Fetch existing study data for this lead if available
  useEffect(() => {
    const fetchStudyData = async () => {
      if (initialData?.lead_id) {
        try {
          setLoading(true);
          const response = await api.get(`/study/for-lead/?lead_id=${initialData.lead_id}`);
          setExistingStudy(response.data);
          
          // Initialize form with existing data
          if (response.data) {
            const studyData = response.data;
            handleInputChange('study', {
              ...formValues.study,
              id: studyData.id,
              last_qualification: studyData.last_qualification,
              last_qualification_yr: studyData.last_qualification_yr,
              ielts_score: studyData.ielts_score,
              study_program: studyData.study_program,
              country: studyData.country,
              student_assesment: studyData.student_assesment,
              can_manage_bs: studyData.can_manage_bs,
              consultation_cost: studyData.consultation_cost,
              lead_inquiry: studyData.lead_inquiry
            });
            
            // Update form fields
            form.setFieldsValue({
              study: {
                last_qualification: studyData.last_qualification,
                last_qualification_yr: studyData.last_qualification_yr,
                ielts_score: studyData.ielts_score,
                study_program: studyData.study_program,
                country: studyData.country,
                student_assesment: studyData.student_assesment,
                can_manage_bs: studyData.can_manage_bs,
                consultation_cost: studyData.consultation_cost
              }
            });
          }
        } catch (error) {
          if (error.response && error.response.status !== 404) {
            message.error("Failed to load study details");
          }
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchStudyData();
  }, [initialData?.lead_id]);
  
  // Initialize form with default values if not already set
  useEffect(() => {
    if (!formValues.study) {
      const defaultStudy = {
        last_qualification: '',
        last_qualification_yr: null,
        ielts_score: null,
        study_program: '',
        country: '',
        student_assesment: '',
        can_manage_bs: false,
        consultation_cost: 0
      };
      
      handleInputChange('study', defaultStudy);
    }
  }, []);
  
  // Study qualification options
  const qualificationOptions = [
    { value: 'intermediate', label: 'Intermediate / FSc' },
    { value: 'bachelors', label: 'Bachelors / BS' },
    { value: 'masters', label: 'Masters / MS' },
    { value: 'phd', label: 'PhD' },
    { value: 'other', label: 'Other' }
  ];
  
  // Study program options
  const programOptions = [
    { value: 'bachelors', label: 'Bachelors Degree' },
    { value: 'masters', label: 'Masters Degree' },
    { value: 'phd', label: 'PhD' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'vocational', label: 'Vocational Training' },
    { value: 'language', label: 'Language Course' },
    { value: 'other', label: 'Other' }
  ];
  
  // Country options
  const countryOptions = [
    { value: 'uk', label: 'United Kingdom' },
    { value: 'usa', label: 'United States' },
    { value: 'canada', label: 'Canada' },
    { value: 'australia', label: 'Australia' },
    { value: 'new_zealand', label: 'New Zealand' },
    { value: 'germany', label: 'Germany' },
    { value: 'france', label: 'France' },
    { value: 'malaysia', label: 'Malaysia' },
    { value: 'china', label: 'China' },
    { value: 'japan', label: 'Japan' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <Grid container spacing={3}>
      {/* Study Details */}
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#9d277c', fontWeight: 'bold' }}>
            Study Details {loading && '(Loading...)'}
          </Typography>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Last Qualification" 
                name={['study', 'last_qualification']}
                rules={[{ required: true, message: 'Please select qualification' }]}
              >
                <Select
                  placeholder="Select your last qualification"
                  value={formValues.study?.last_qualification}
                  onChange={(value) => handleInputChange('study', { ...formValues.study, last_qualification: value })}
                  disabled={loading}
                >
                  {qualificationOptions.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Last Qualification Year" 
                name={['study', 'last_qualification_yr']}
                rules={[{ required: true, message: 'Please enter year' }]}
              >
                <InputNumber 
                  min={1980} 
                  max={dayjs().year()}
                  style={{ width: '100%' }} 
                  value={formValues.study?.last_qualification_yr}
                  onChange={(value) => handleInputChange('study', { ...formValues.study, last_qualification_yr: value })}
                  disabled={loading}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="IELTS Score" 
                name={['study', 'ielts_score']}
                rules={[{ required: true, message: 'Please enter IELTS score' }]}
              >
                <InputNumber 
                  min={0} 
                  max={9} 
                  step={0.5}
                  style={{ width: '100%' }} 
                  value={formValues.study?.ielts_score}
                  onChange={(value) => handleInputChange('study', { ...formValues.study, ielts_score: value })}
                  disabled={loading}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Study Program" 
                name={['study', 'study_program']}
                rules={[{ required: true, message: 'Please select study program' }]}
              >
                <Select
                  placeholder="Select desired study program"
                  value={formValues.study?.study_program}
                  onChange={(value) => handleInputChange('study', { ...formValues.study, study_program: value })}
                  disabled={loading}
                >
                  {programOptions.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item 
                label="Country" 
                name={['study', 'country']}
                rules={[{ required: true, message: 'Please select country' }]}
              >
                <Select
                  placeholder="Select desired country"
                  value={formValues.study?.country}
                  onChange={(value) => handleInputChange('study', { ...formValues.study, country: value })}
                  disabled={loading}
                >
                  {countryOptions.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item 
                label="Student Assessment" 
                name={['study', 'student_assesment']}
                rules={[{ required: true, message: 'Please enter student assessment' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="Enter student assessment details"
                  value={formValues.study?.student_assesment}
                  onChange={(e) => handleInputChange('study', { ...formValues.study, student_assesment: e.target.value })}
                  disabled={loading}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Can Manage BS" 
                name={['study', 'can_manage_bs']}
                valuePropName="checked"
              >
                <Switch 
                  checked={formValues.study?.can_manage_bs}
                  onChange={(checked) => handleInputChange('study', { ...formValues.study, can_manage_bs: checked })}
                  disabled={loading}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Consultation Cost" 
                name={['study', 'consultation_cost']}
                rules={[{ required: true, message: 'Please enter consultation cost' }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  value={formValues.study?.consultation_cost}
                  onChange={(value) => handleInputChange('study', { ...formValues.study, consultation_cost: value })}
                  disabled={loading}
                />
              </Form.Item>
            </Col>
          </Row>
        </Paper>
      </Grid>
    </Grid>
  );
});

export default StudyForm; 