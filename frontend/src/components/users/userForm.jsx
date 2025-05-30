import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  Card, 
  Row, 
  Col, 
  Divider, 
  Switch, 
  Space, 
  Typography, 
  Spin,
  Upload,
  message
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  LockOutlined, 
  TeamOutlined,
  UploadOutlined,
  LoadingOutlined,
  PlusOutlined,
  BankOutlined
} from '@ant-design/icons';
import api, { departmentService, branchService } from '../../services/api';

const { Option } = Select;
const { Title, Text } = Typography;

const UserForm = ({ 
  initialData = {}, 
  isEditMode = false,
  loading = false,
  onFinish,
  form 
}) => {
  const formInstance = form || Form.useForm()[0];
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(initialData.profile_picture || null);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  
  // Role options based on the User model
  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'department_head', label: 'Department Head' },
    { value: 'manager', label: 'Manager' },
    { value: 'team_lead', label: 'Team Lead' },
    { value: 'sales_agent', label: 'Sales Agent' },
    { value: 'support_agent', label: 'Support Agent' },
    { value: 'processor', label: 'Processor' }
  ];
  
  // Fetch branches and departments when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setBranchesLoading(true);
      setDepartmentsLoading(true);
      
      try {
        const tenantId = localStorage.getItem('tenant_id');
        if (!tenantId) {
          message.error('Tenant ID is missing. Please log in again.');
          navigate('/login');
          return;
        }
        
        // Fetch branches and departments in parallel
        const [branchesData, departmentsData] = await Promise.all([
          branchService.getBranches(tenantId),
          departmentService.getDepartments(tenantId)
        ]);
        
        setBranches(branchesData || []);
        setDepartments(departmentsData || []);
      } catch (error) {
        console.error('Error fetching form data:', error);
        message.error('Failed to load form data. Please try again.');
      } finally {
        setBranchesLoading(false);
        setDepartmentsLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]); // Only depend on navigate
  
  // Update form with initial data when it changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      formInstance.setFieldsValue({
        ...initialData,
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        department: initialData.department || undefined,
        branch: initialData.branch || undefined,
        profile_picture: initialData.profile_picture ? { url: initialData.profile_picture } : undefined,
        profile_picture_file: null
      });
    }
  }, [initialData, formInstance]);
  
  // Image upload configuration
  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG files!');
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
    }
    
    return isJpgOrPng && isLt2M;
  };

  // Enhanced handleImageChange function
  const handleImageChange = (info) => {
    if (info.file.status === 'uploading') {
      setImageLoading(true);
      return;
    }
    
    if (info.file.status === 'done' || info.file.status === 'error') {
      setImageLoading(false);
      
      // Get the file object
      const fileObj = info.file.originFileObj;
      if (fileObj) {
        // Store the file object in form state for submission
        formInstance.setFieldsValue({ profile_picture_file: fileObj });
        
        // Preview the image
        getBase64(fileObj, (url) => {
          setImageUrl(url);
        });
      }
    }
  };

  // Convert file to base64 for preview
  const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  // Custom upload button
  const uploadButton = (
    <div>
      {imageLoading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload Photo</div>
    </div>
  );

  // Enhanced customUploadRequest function - simplified
  const customUploadRequest = async ({ file, onSuccess, onError }) => {
    try {
      // Store the original file for future use
      formInstance.setFieldsValue({ 
        profile_picture_file: file 
      });
      
      // Generate preview
      getBase64(file, (url) => {
        setImageUrl(url);
      });
      
      // Mark as success
      onSuccess("ok");
    } catch (error) {
      onError(error);
    }
  };
  
  // Simplified values change handler
  const handleValuesChange = (changedValues) => {
    // No need to maintain separate state, form instance handles it
    console.log('Form values changed:', changedValues);
  };

  // Handle form submission
  const handleFormSubmit = async (values) => {
    if (loading || submitting) return;
    
    try {
      setSubmitting(true);
      
      // Prepare form data
      const formData = new FormData();
      
      // Add all form values to FormData
      Object.keys(values).forEach(key => {
        if (key === 'profile_picture_file' && values[key]) {
          formData.append('profile_picture', values[key]);
        } else if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });
      
      // Call the onFinish callback with the form data
      if (onFinish) {
        await onFinish(formData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      message.error('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle form cancellation
  const handleCancel = () => {
    navigate('/dashboard/users');
  };
  
  if (loading || branchesLoading || departmentsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>Loading form data...</div>
      </div>
    );
  }

  return (
    <Card variant="default">
      <Form
        form={formInstance}
        layout="vertical"
        initialValues={{
          ...initialData,
          is_active: initialData.is_active !== undefined ? initialData.is_active : true,
          department: initialData.department || undefined,
          branch: initialData.branch || undefined,
          profile_picture: initialData.profile_picture ? { url: initialData.profile_picture } : undefined,
          profile_picture_file: null
        }}
        onFinish={handleFormSubmit}
        onValuesChange={handleValuesChange}
        requiredMark={false}
      >
        {/* Profile Picture Upload */}
        <Form.Item 
          label="Profile Picture" 
          name="profile_picture"
        >
          <Upload
            name="profile_picture"
            listType="picture-card"
            className="avatar-uploader"
            showUploadList={false}
            customRequest={customUploadRequest}
            beforeUpload={(file) => {
              // Store the file directly in the form values
              formInstance.setFieldsValue({ profile_picture_file: file });
              
              // Validate file type and size, but don't prevent upload
              const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
              if (!isJpgOrPng) {
                message.error('You can only upload JPG/PNG files!');
              }
              
              const isLt2M = file.size / 1024 / 1024 < 2;
              if (!isLt2M) {
                message.error('Image must be smaller than 2MB!');
              }
              
              // Always return true to proceed with custom upload
              return true;
            }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Profile" style={{ width: '100%' }} />
            ) : (
              <div>
                {imageLoading ? <LoadingOutlined /> : <PlusOutlined />}
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>
        
        {/* Hidden field to store the file object */}
        <Form.Item name="profile_picture_file" hidden>
          <Input />
        </Form.Item>
        
        <Row gutter={24}>
          <Col span={24}>
            <Title level={5}>Basic Information</Title>
            <Text type="secondary">User account details and personal information</Text>
            <Divider />
          </Col>
          
          <Col xs={24} sm={24} md={18}>
            <Row gutter={16}>
              {/* First Name */}
              <Col xs={24} sm={12}>
                <Form.Item
                  name="first_name"
                  label="First Name"
                  rules={[{ required: true, message: 'Please enter first name' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="First Name" />
                </Form.Item>
              </Col>
              
              {/* Last Name */}
              <Col xs={24} sm={12}>
                <Form.Item
                  name="last_name"
                  label="Last Name"
                  rules={[{ required: true, message: 'Please enter last name' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Last Name" />
                </Form.Item>
              </Col>
              
              {/* Email */}
              <Col xs={24} sm={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Please enter email' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="Email Address" />
                </Form.Item>
              </Col>
              
              {/* Phone */}
              <Col xs={24} sm={12}>
                <Form.Item
                  name="phone_number"
                  label="Phone Number"
                >
                  <Input prefix={<PhoneOutlined />} placeholder="Phone Number" />
                </Form.Item>
              </Col>
            </Row>
          </Col>
          
          {/* Password - only for new users */}
          {!isEditMode && (
            <>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please enter password' },
                    { min: 8, message: 'Password must be at least 8 characters' }
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="confirm_password"
                  label="Confirm Password"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Please confirm password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Passwords do not match'));
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
                </Form.Item>
              </Col>
            </>
          )}
          
          <Col span={24}>
            <Divider />
            <Title level={5}>Organization Information</Title>
            <Text type="secondary">Assign branch, role and department to the user</Text>
            <Divider />
          </Col>
          
          {/* Branch Dropdown */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="branch"
              label="Branch"
            >
              <Select 
                placeholder={branchesLoading ? "Loading branches..." : "Select Branch"} 
                allowClear
                loading={branchesLoading}
                notFoundContent={!branchesLoading && (!branches || branches.length === 0) ? "No branches found" : undefined}
              >
                {Array.isArray(branches) && branches.map(branch => (
                  <Option key={branch.id} value={branch.id}>
                    {branch.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          {/* Department Dropdown */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="department"
              label="Department"
            >
              <Select 
                placeholder={departmentsLoading ? "Loading departments..." : "Select Department"} 
                allowClear
                loading={departmentsLoading}
                notFoundContent={!departmentsLoading && (!departments || departments.length === 0) ? "No departments found" : undefined}
              >
                {Array.isArray(departments) && departments.map(dept => (
                  <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          {/* Role */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Please select role' }]}
            >
              <Select placeholder="Select Role">
                {roleOptions.map(role => (
                  <Option key={role.value} value={role.value}>{role.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          {/* Industry */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="industry"
              label="Industry"
              initialValue="hajj_umrah"
            >
              <Select placeholder="Select Industry">
                <Option value="hajj_umrah">Hajj and Umrah</Option>
                <Option value="travel_tourism">Travel and Tourism</Option>
                <Option value="immigration">Immigration Consultancy</Option>
                <Option value="real_estate">Real Estate</Option>
                <Option value="ecommerce">Ecommerce</Option>
              </Select>
            </Form.Item>
          </Col>
          
          {/* Active Status */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="is_active"
              label="Active Status"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren="Active" 
                unCheckedChildren="Inactive"
              />
            </Form.Item>
          </Col>
        </Row>
        
        {/* Form Actions */}
        <Divider />
        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting || loading}
              style={{ backgroundColor: '#9d277c', borderColor: '#9d277c' }}
              disabled={submitting || loading}
            >
              {isEditMode ? 'Update User' : 'Create User'}
            </Button>
            <Button onClick={handleCancel} disabled={submitting || loading}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UserForm; 