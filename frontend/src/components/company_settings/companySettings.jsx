import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Input, Button, Upload, Spin, Descriptions, Switch, Divider, Image } from 'antd';
import { UploadOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../../services/api';

// Add styles
import './companySettings.css';

const CompanySettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const tenant_id = localStorage.getItem('tenant_id');

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        if (!tenant_id) {
          setLoading(false);
          return;
        }

        const response = await api.get(`/company-settings/?tenant_id=${tenant_id}`);
        
        // Check if we have results in the response
        // The API might return an object with results property or directly an array
        const results = response.data.results || response.data;
        
        if (results && (Array.isArray(results) && results.length > 0)) {
          const settings = results[0];
          setCompanyData(settings);
          form.setFieldsValue(settings);
          if (settings.logo) {
            setImageUrl(settings.logo);
          }
          // If we found existing data, default to view mode
          setEditMode(false);
        } else {
          // If no data exists, go straight to edit mode
          setEditMode(true);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchCompanySettings();
  }, [tenant_id, form]);

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const onFinish = async (values) => {
    try {
      if (!tenant_id) {
        return;
      }

      setSubmitting(true);

      // Create FormData object to handle file uploads
      const formData = new FormData();
      
      // Append form values to FormData
      Object.keys(values).forEach(key => {
        if (key === 'logo') {
          // Handle logo safely - check if it exists and has the right structure
          if (values.logo && Array.isArray(values.logo) && values.logo.length > 0 && values.logo[0]?.originFileObj) {
            formData.append('logo', values.logo[0].originFileObj);
          } else if (values.logo && values.logo.originFileObj) {
            // Handle case where logo is a single file object
            formData.append('logo', values.logo.originFileObj);
          }
        } else {
          formData.append(key, values[key]);
        }
      });
      
      // Ensure tenant_id is included in the formData
      formData.append('tenant_id', tenant_id);

      let response;
      
      if (companyData) {
        // Update existing settings
        response = await api.patch(
          `/company-settings/${tenant_id}/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        // Create new settings
        response = await api.post(
          `/company-settings/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      // Update local state with response data - handle different response formats
      if (response?.data) {
        const responseData = response.data.results?.[0] || response.data;
        setCompanyData(responseData);
        form.setFieldsValue(responseData);
        if (responseData.logo) {
          setImageUrl(responseData.logo);
        }
      }
      
      // Switch back to view mode after successful save
      setEditMode(false);

    } catch (error) {
      // Try creating if update fails with 404
      if (error.response?.status === 404 && companyData) {
        try {
          const createResponse = await api.post(
            `/company-settings/`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          
          if (createResponse?.data) {
            const responseData = createResponse.data.results?.[0] || createResponse.data;
            setCompanyData(responseData);
            form.setFieldsValue(responseData);
            if (responseData.logo) {
              setImageUrl(responseData.logo);
            }
            setEditMode(false);
          }
        } catch (createError) {
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Simplify upload props
  const uploadProps = {
    name: 'logo',
    maxCount: 1,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        return false;
      }
      
      // Preview image
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Prevent auto upload
      return false;
    },
  };

  // Safe way to get file list
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList || [];
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading company settings...</p>
      </div>
    );
  }

  return (
    <Row justify="center">
      <Col xs={24} sm={24} md={20} lg={18} xl={16}>
        <Card 
          title="Company Settings" 
          className="company-settings-card"
          variant="default"
          extra={
            companyData && (
              <Switch
                checkedChildren={<EditOutlined />}
                unCheckedChildren={<EyeOutlined />}
                checked={editMode}
                onChange={toggleEditMode}
              />
            )
          }
        >
          {!editMode && companyData ? (
            // VIEW MODE
            <div className="company-info">
              {companyData.logo && (
                <div className="company-logo">
                  <Image 
                    src={companyData.logo} 
                    alt={companyData.company_name} 
                    width={200} 
                  />
                </div>
              )}
              
              <Divider />
              
              <Descriptions 
                bordered 
                layout="vertical" 
                column={1}
                className="company-details"
              >
                <Descriptions.Item label="Company Name">{companyData.company_name}</Descriptions.Item>
                <Descriptions.Item label="Theme Color">
                  <div className="color-box" style={{ backgroundColor: companyData.theme_color }}>
                    {companyData.theme_color}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Address">{companyData.address}</Descriptions.Item>
                <Descriptions.Item label="Phone">{companyData.phone}</Descriptions.Item>
                <Descriptions.Item label="Email">{companyData.email}</Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {new Date(companyData.created_at).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Updated At">
                  {new Date(companyData.updated_at).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </div>
          ) : (
            // EDIT MODE
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                company_name: companyData?.company_name,
                theme_color: companyData?.theme_color || '#000000',
                address: companyData?.address,
                phone: companyData?.phone,
                email: companyData?.email,
              }}
            >
              <Form.Item
                name="company_name"
                label="Company Name"
                rules={[{ required: true, message: 'Please enter company name' }]}
              >
                <Input placeholder="Enter company name" />
              </Form.Item>

              <Form.Item
                name="logo"
                label="Company Logo"
                valuePropName="fileList"
                getValueFromEvent={normFile}
              >
                <Upload {...uploadProps} listType="picture-card">
                  {!imageUrl && <div><UploadOutlined /><div style={{ marginTop: 8 }}>Upload</div></div>}
                </Upload>
              </Form.Item>

              {imageUrl && (
                <div style={{ marginBottom: 16 }}>
                  <img src={imageUrl} alt="Company Logo" style={{ maxWidth: 200 }} />
                </div>
              )}

              <Form.Item
                name="theme_color"
                label="Theme Color"
                rules={[
                  { 
                    required: true,
                    message: 'Please select theme color',
                    pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
                  }
                ]}
              >
                <Input type="color" style={{ width: 100, height: 32 }} />
              </Form.Item>

              <Form.Item
                name="address"
                label="Address"
                rules={[{ required: true, message: 'Please enter address' }]}
              >
                <Input.TextArea rows={4} placeholder="Enter company address" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="Enter phone number (e.g., +1234567890)" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="Enter company email" />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submitting} 
                  block
                  className="company-settings-submit-btn"
                  style={{ backgroundColor: companyData?.theme_color }}
                >
                  {companyData ? 'Update Company Settings' : 'Save Company Settings'}
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default CompanySettings;
