import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Select, 
  Button, 
  DatePicker, 
  Space, 
  Divider, 
  Typography,
  Collapse,
  Radio,
  Checkbox,
  Row,
  Col
} from 'antd';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
import { Box } from '@mui/material';
import dayjs from 'dayjs';
import api from '../../../services/api';

const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { Option } = Select;

/**
 * Component for filtering leads
 * @param {object} initialFilters - Initial filter values
 * @param {function} onFilterChange - Callback when filters change
 */
const LeadFilters = ({ initialFilters = {}, onFilterChange }) => {
  const [form] = Form.useForm();
  const [expanded, setExpanded] = useState(false);
  const [leadTypeOptions, setLeadTypeOptions] = useState([]);
  
  // Function to get lead type options based on industry
  const getIndustryLeadTypes = async () => {
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
        }
      } catch (err) {
        // Silently handle error
      }
      
      // Check if industry is available in the user object
      const userIndustry = userObj?.industry || '';
      // Also check for userData.industry which is seen in the screenshot
      const userData = userObj?.userData || {};
      const userDataIndustry = (userData && userData.industry) ? userData.industry : '';
      
      // Use the first available industry value
      const effectiveIndustry = userDataIndustry || userIndustry || directIndustry || '';
      
      // Default lead types for any industry
      const commonLeadTypes = [
        { value: 'flight', label: 'Flight' },
        { value: 'visa', label: 'Visa' },
        { value: 'transfer', label: 'Transfer' }
      ];
      
      // Convert to lowercase and remove quotes for comparison
      const normalizedIndustry = effectiveIndustry ? effectiveIndustry.toLowerCase().replace(/"/g, '') : '';

      // If industry is general, fetch lead types from generalProduct API
      if (normalizedIndustry === 'general') {
        try {
          const tenantId = localStorage.getItem('tenant_id');
          if (!tenantId) {
            throw new Error('Tenant ID not found');
          }

          // Fetch products from generalProduct API
          const response = await api.get(`/general-product/products/?tenant=${tenantId}`);
          
          // Map the products to lead type options format
          const generalProducts = Array.isArray(response.data) 
            ? response.data 
            : (response.data?.results && Array.isArray(response.data.results))
              ? response.data.results 
              : [];

          const leadTypes = generalProducts.map(product => ({
            value: product.productName.toLowerCase().replace(/\s+/g, '_'),
            label: product.productName
          }));

          return [...leadTypes, ...commonLeadTypes];
        } catch (error) {
          console.error('Error fetching general products:', error);
          return commonLeadTypes;
        }
      }
      
      // Industry-specific lead types for other industries
      let leadTypes = [];
      
      switch(normalizedIndustry) {
        case 'hajj_umrah':
          leadTypes = [
            { value: 'hajj_package', label: 'Hajj Package' },
            { value: 'custom_umrah', label: 'Custom Umrah' },
            { value: 'readymade_umrah', label: 'Readymade Umrah' },
            { value: 'ziyarat', label: 'Ziyarat' },
            ...commonLeadTypes
          ];
          break;
        case 'immigration':
          leadTypes = [
            { value: 'visit_visa', label: 'Visit Visa' },
            { value: 'skilled_immigration', label: 'Skilled Immigration' },
            { value: 'job_visa', label: 'Job Visa' },
            { value: 'trc', label: 'TRC' },
            { value: 'business_immigration', label: 'Business Immigration' },
            { value: 'study_visa', label: 'Study Visa' }
          ];
          break;
        case 'travel_tourism':
          leadTypes = [
            { value: 'travel_package', label: 'Travel Package' },
            ...commonLeadTypes
          ];
          break;
        case 'real_estate':
          leadTypes = [
            { value: 'development_project', label: 'Development Project' }
          ];
          break;
        default:
          // Default to hajj_umrah if no industry is specified
          leadTypes = [
            { value: 'hajj_package', label: 'Hajj Package' },
            { value: 'custom_umrah', label: 'Custom Umrah' },
            { value: 'readymade_umrah', label: 'Readymade Umrah' },
            { value: 'ziyarat', label: 'Ziyarat' },
            ...commonLeadTypes
          ];
      }
      
      return leadTypes;
    } catch (error) {
      // Return default lead types as fallback
      return [
        { value: 'hajj_package', label: 'Hajj Package' },
        { value: 'custom_umrah', label: 'Custom Umrah' },
        { value: 'readymade_umrah', label: 'Readymade Umrah' },
        { value: 'flight', label: 'Flight' },
        { value: 'visa', label: 'Visa' },
        { value: 'transfer', label: 'Transfer' },
        { value: 'ziyarat', label: 'Ziyarat' }
      ];
    }
  };

  // Initialize lead type options based on user's industry
  useEffect(() => {
    const initializeLeadTypes = async () => {
      try {
        // Get industry-specific lead types
        const industryLeadTypes = await getIndustryLeadTypes();
        setLeadTypeOptions(industryLeadTypes);
      } catch (error) {
        // Set default options as fallback
        const defaultOptions = [
          { value: 'hajj_package', label: 'Hajj Package' },
          { value: 'custom_umrah', label: 'Custom Umrah' },
          { value: 'readymade_umrah', label: 'Readymade Umrah' },
          { value: 'flight', label: 'Flight' },
          { value: 'visa', label: 'Visa' },
          { value: 'transfer', label: 'Transfer' },
          { value: 'ziyarat', label: 'Ziyarat' }
        ];
        setLeadTypeOptions(defaultOptions);
      }
    };

    initializeLeadTypes();
  }, []);

  // Set initial values when component mounts or initialFilters changes
  useEffect(() => {
    form.setFieldsValue({
      ...initialFilters,
      // Convert date strings to dayjs objects if they exist
      created_date: initialFilters.created_date ? [
        dayjs(initialFilters.created_date[0]),
        dayjs(initialFilters.created_date[1])
      ] : undefined,
      last_contacted: initialFilters.last_contacted ? [
        dayjs(initialFilters.last_contacted[0]),
        dayjs(initialFilters.last_contacted[1])
      ] : undefined,
      next_follow_up: initialFilters.next_follow_up ? [
        dayjs(initialFilters.next_follow_up[0]),
        dayjs(initialFilters.next_follow_up[1])
      ] : undefined
    });
  }, [form, initialFilters]);
  
  // Lead status options based on the model
  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'non_potential', label: 'Non-Potential' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' }
  ];
  
  // Lead source options based on the model
  const sourceOptions = [
    { value: 'fb_form', label: 'FB Form' },
    { value: 'messenger', label: 'Messenger' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'insta_form', label: 'Insta Form' },
    { value: 'website_form', label: 'Website Form' },
    { value: 'website_chat', label: 'Website Chat' },
    { value: 'referral', label: 'Referral' },
    { value: 'walk_in', label: 'Walk In' }
  ];
  
  // Activity status options based on the model
  const activityStatusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];
  
  // Handle form submission
  const handleFinish = (values) => {
    // Format date ranges for API
    const formattedValues = { ...values };
    
    // Format created_date range if it exists
    if (values.created_date && values.created_date.length === 2) {
      formattedValues.created_date = [
        values.created_date[0].format('YYYY-MM-DD'),
        values.created_date[1].format('YYYY-MM-DD')
      ];
    }
    
    // Format last_contacted range if it exists
    if (values.last_contacted && values.last_contacted.length === 2) {
      formattedValues.last_contacted = [
        values.last_contacted[0].format('YYYY-MM-DD'),
        values.last_contacted[1].format('YYYY-MM-DD')
      ];
    }
    
    // Format next_follow_up range if it exists
    if (values.next_follow_up && values.next_follow_up.length === 2) {
      formattedValues.next_follow_up = [
        values.next_follow_up[0].format('YYYY-MM-DD'),
        values.next_follow_up[1].format('YYYY-MM-DD')
      ];
    }
    
    // Call the parent component's filter change handler
    onFilterChange(formattedValues);
  };
  
  // Reset all filters
  const handleReset = () => {
    form.resetFields();
    onFilterChange({});
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  return (
    <Card 
      title={
        <Space>
          <FilterOutlined />
          <span>Lead Filters</span>
        </Space>
      }
      extra={
        <Button type="link" onClick={toggleExpanded}>
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
      }
      style={{ marginBottom: 16 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={initialFilters}
      >
        <Row gutter={16}>
          {/* Basic Filters - Always Visible */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="status" label="Status">
              <Select 
                mode="multiple" 
                placeholder="Select status" 
                allowClear
                style={{ width: '100%' }}
              >
                {statusOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="lead_type" label="Lead Type">
              <Select 
                mode="multiple" 
                placeholder="Select lead type" 
                allowClear
                style={{ width: '100%' }}
              >
                {leadTypeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="lead_activity_status" label="Activity Status">
              <Select 
                placeholder="Select activity status" 
                allowClear
                style={{ width: '100%' }}
              >
                {activityStatusOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        {/* Advanced Filters - Visible when expanded */}
        {expanded && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="source" label="Lead Source">
                  <Select 
                    mode="multiple" 
                    placeholder="Select source" 
                    allowClear
                    style={{ width: '100%' }}
                  >
                    {sourceOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="created_date" label="Created Date">
                  <RangePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="last_contacted" label="Last Contacted">
                  <RangePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="next_follow_up" label="Next Follow-up">
                  <RangePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="has_notes" label="Has Notes">
                  <Radio.Group>
                    <Radio value={true}>Yes</Radio>
                    <Radio value={false}>No</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="has_documents" label="Has Documents">
                  <Radio.Group>
                    <Radio value={true}>Yes</Radio>
                    <Radio value={false}>No</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="has_activities" label="Has Activities">
                  <Radio.Group>
                    <Radio value={true}>Yes</Radio>
                    <Radio value={false}>No</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="assigned" label="Assignment">
                  <Select placeholder="Select assignment" allowClear>
                    <Option value="assigned">Assigned</Option>
                    <Option value="unassigned">Unassigned</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
        
        <Divider style={{ margin: '12px 0' }} />
        
        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleReset} icon={<ClearOutlined />}>
              Reset
            </Button>
            <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>
              Apply Filters
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default LeadFilters;
