import React, { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import api, { departmentService, branchService } from '../../services/api';

const { Option } = Select;
const { Title, Text } = Typography;

const UserForm = ({ 
  initialData = {}, 
  isEditMode = false,
  loading = false,
  onSuccess 
}) => {
  const [form] = Form.useForm();
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
          console.warn('No tenant ID found in local storage');
          setBranchesLoading(false);
          setDepartmentsLoading(false);
          return;
        }
        
        console.log('Fetching data for tenant ID:', tenantId);
        
        // Fetch branches using the service function
        try {
          console.log('Fetching branches...');
          const branchResponse = await branchService.getBranches(tenantId);
          console.log('Raw branch data received:', branchResponse);
          
          // Ensure branchData is an array
          let branchData = [];
          
          if (Array.isArray(branchResponse)) {
            branchData = branchResponse;
          } else if (branchResponse && typeof branchResponse === 'object') {
            // Handle possible pagination response from DRF
            if (Array.isArray(branchResponse.results)) {
              branchData = branchResponse.results;
            } else {
              // Try to convert object to array if it's an object
              console.warn('Branch data is not an array, attempting to convert:', branchResponse);
              branchData = Object.values(branchResponse);
            }
          }
          
          console.log('Processed branch data (array):', branchData);
          setBranches(branchData);
        } catch (branchError) {
          console.error('Error fetching branches:', branchError);
          message.error('Failed to load branches. Please try again later.');
          // Ensure branches is set to an empty array on error
          setBranches([]);
        }
        
        // Fetch departments using the service function
        try {
          console.log('Fetching departments...');
          const deptResponse = await departmentService.getDepartments(tenantId);
          console.log('Raw department data received:', deptResponse);
          
          // Ensure departmentData is an array
          let departmentData = [];
          
          if (Array.isArray(deptResponse)) {
            departmentData = deptResponse;
          } else if (deptResponse && typeof deptResponse === 'object') {
            // Handle possible pagination response from DRF
            if (Array.isArray(deptResponse.results)) {
              departmentData = deptResponse.results;
            } else {
              // Try to convert object to array if it's an object
              console.warn('Department data is not an array, attempting to convert:', deptResponse);
              departmentData = Object.values(deptResponse);
            }
          }
          
          console.log('Processed department data (array):', departmentData);
          setDepartments(departmentData);
        } catch (deptError) {
          console.error('Error fetching departments:', deptError);
          message.error('Failed to load departments. Please try again later.');
          // Ensure departments is set to an empty array on error
          setDepartments([]);
        }
        
      } catch (error) {
        console.error('Error in data fetching process:', error);
        message.error('Failed to fetch organization data');
        // Ensure both arrays are empty on error
        setBranches([]);
        setDepartments([]);
      } finally {
        setBranchesLoading(false);
        setDepartmentsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
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
    console.log('handleImageChange called with file status:', info.file.status);
    
    if (info.file.status === 'uploading') {
      setImageLoading(true);
      console.log('File uploading...', info.file);
      return;
    }
    
    if (info.file.status === 'done' || info.file.status === 'error') {
      setImageLoading(false);
      console.log('File status changed to:', info.file.status);
      
      // Get the file object
      const fileObj = info.file.originFileObj;
      if (fileObj) {
        console.log('Image file details:', {
          name: fileObj.name,
          size: fileObj.size,
          type: fileObj.type,
          lastModified: fileObj.lastModified
        });
        
        // Store the file object in form state for submission
        console.log('Setting profile_picture_file in form:', fileObj);
        form.setFieldsValue({ profile_picture_file: fileObj });
        
        // Preview the image
        getBase64(fileObj, (url) => {
          console.log('Base64 image preview generated');
          setImageUrl(url);
        });
      } else {
        console.warn('No originFileObj found in info.file');
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
  
  // Add this utility function near the top of your UserForm component
  const tryApiEndpoints = async (formData, isEditMode, initialData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    
    // Try endpoints in order of likelihood
    const endpoints = [
      { prefix: 'auth/users', description: 'Auth prefix endpoint' },
      { prefix: 'users', description: 'Direct users endpoint' },
      { prefix: 'auth/register', description: 'Register endpoint (create only)' }
    ];
    
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying ${endpoint.description}...`);
        
        if (isEditMode) {
          if (endpoint.prefix === 'auth/register') continue; // Skip register for edit
          return await api.put(`${endpoint.prefix}/${initialData.id}/`, formData, config);
        } else {
          const url = endpoint.prefix.endsWith('register') ? endpoint.prefix : `${endpoint.prefix}/`;
          return await api.post(url, formData, config);
        }
      } catch (error) {
        console.log(`${endpoint.description} failed:`, error.response?.status || error.message);
        lastError = error;
        
        // If it's not a 404, rethrow immediately as it's likely a data problem
        if (error.response && error.response.status !== 404) {
          throw error;
        }
        
        // Otherwise continue to next endpoint
      }
    }
    
    // If we got here, all endpoints failed
    throw lastError;
  };

  // Enhanced customUploadRequest function - simplified
  const customUploadRequest = async ({ file, onSuccess, onError }) => {
    try {
      console.log('File selected for upload:', file.name);
      
      // Store the original file for future use
      form.setFieldsValue({ 
        profile_picture_file: file 
      });
      
      // Add as global reference for debugging
      window.uploadedPictureFile = file;
      
      // Generate preview
      getBase64(file, (url) => {
        setImageUrl(url);
      });
      
      // Mark as success
      onSuccess("ok");
    } catch (error) {
      console.error('Error in custom upload:', error);
      onError(error);
    }
  };
  
  // Form submission function with improved tenant handling
  const onFinish = async (values) => {
    try {
      setSubmitting(true);
      console.log('Submitting form with values:', values);
      
      // Get tenant_id from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      
      if (!tenantId) {
        message.error('Tenant information is missing. Please log in again.');
        navigate('/login');
        return;
      }
      
      console.log('Creating user for tenant:', tenantId);
      
      // Get the file from all possible sources
      let profilePictureFile = null;
      
      // Check multiple sources for the file
      if (values.profile_picture_file && values.profile_picture_file instanceof File) {
        profilePictureFile = values.profile_picture_file;
      } else if (window.uploadedPictureFile) {
        profilePictureFile = window.uploadedPictureFile;
      }
      
      // Create FormData object
      const formData = new FormData();
      
      // Add all user fields to FormData
      formData.append('email', values.email);
      formData.append('first_name', values.first_name || '');
      formData.append('last_name', values.last_name || '');
      formData.append('phone_number', values.phone_number || '');
      formData.append('role', values.role);
      formData.append('tenant_id', tenantId); // IMPORTANT: ensure tenant_id is always included
      formData.append('is_active', values.is_active ? 'true' : 'false');
      
      // Get tenant industry from localStorage - this is needed for TenantUser creation
      const userStr = localStorage.getItem('user');
      let industry = '';
      
      // Try to get industry from user object in localStorage
      try {
        if (userStr) {
          const userObj = JSON.parse(userStr);
          industry = userObj?.industry || '';
          if (!industry && userObj?.userData?.industry) {
            industry = userObj.userData.industry;
          }
        }
      } catch (err) {
        console.warn('Error parsing user from localStorage:', err);
      }
      
      // Fallback to direct industry key if needed
      if (!industry) {
        industry = localStorage.getItem('industry') || 'hajj_umrah'; // Default to hajj_umrah if nothing found
      }
      
      // Use industry from form if provided, otherwise use the one from localStorage
      const selectedIndustry = values.industry || industry;
      
      // Add industry to formData - this is required for TenantUser creation
      formData.append('industry', selectedIndustry);
      console.log('Adding industry to form data:', selectedIndustry);
      
      if (values.department) {
        formData.append('department_id', values.department);
      }
      
      // Add branch_id if selected
      if (values.branch) {
        console.log('Adding branch ID to form data:', values.branch);
        formData.append('branch_id', values.branch);
      }
      
      // Add password for new users
      if (!isEditMode && values.password) {
        formData.append('password', values.password);
      }
      
      // Append profile picture if available
      if (profilePictureFile) {
        formData.append('profile_picture', profilePictureFile, profilePictureFile.name);
      }
      
      // Log FormData entries for debugging
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`${pair[0]}: File: ${pair[1].name}`);
        } else {
          console.log(`${pair[0]}: ${pair[1]}`);
        }
      }
      
      // Define API endpoints to try - prioritize auth/users/ endpoint
      const endpoints = isEditMode 
        ? [`auth/users/${initialData.id}/`, `users/${initialData.id}/`]
        : [`auth/users/`, `users/`];
      
      // Track detailed error information for better debugging
      const errorDetails = [];
      
      // Try all endpoints in sequence
      for (const endpoint of endpoints) {
        try {
          console.log(`Attempting to submit to endpoint: ${endpoint}`);
          
          const response = isEditMode
            ? await api.put(endpoint, formData, {
                headers: {'Content-Type': 'multipart/form-data'}
              })
            : await api.post(endpoint, formData, {
                headers: {'Content-Type': 'multipart/form-data'}
              });
          
          console.log(`Success with endpoint ${endpoint}!`, response.data);
          
          // Success! Show message and navigate
          message.success(
            isEditMode 
              ? `User ${values.email} updated successfully!` 
              : `User ${values.email} created successfully!`
          );
          
          form.resetFields();
          setImageUrl(null);
          
          if (onSuccess) {
            onSuccess(response.data);
          }
          
          return; // Exit after successful submission
        } catch (error) {
          // Capture detailed error information
          const errorInfo = {
            endpoint,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          };
          
          errorDetails.push(errorInfo);
          console.error(`Error with endpoint ${endpoint}:`, errorInfo);
          
          // Continue to next endpoint
        }
      }
      
      // If we get here, all endpoints failed
      console.error('All endpoints failed:', errorDetails);
      
      // Provide more detailed error message based on collected errors
      let errorMessage = 'Failed to create user. Server responded with:';
      
      errorDetails.forEach(err => {
        if (err.status === 400) {
          // For 400 errors, show validation issues
          if (typeof err.data === 'object') {
            const validationErrors = Object.entries(err.data)
              .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join('\n');
            
            errorMessage += `\n\n${err.endpoint}: ${validationErrors}`;
          } else {
            errorMessage += `\n\n${err.endpoint}: ${err.data || err.statusText}`;
          }
        } else {
          // For other errors
          errorMessage += `\n\n${err.endpoint}: ${err.status} ${err.statusText}`;
        }
      });
      
      message.error(errorMessage);
      
    } catch (error) {
      console.error('Unexpected error:', error);
      message.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle cancellation
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
    <Card bordered={false}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ...initialData,
          is_active: initialData.is_active !== undefined ? initialData.is_active : true,
          department: initialData.department || undefined,
          branch: initialData.branch || undefined,
          profile_picture: initialData.profile_picture ? { url: initialData.profile_picture } : undefined,
          profile_picture_file: null // Add this hidden field
        }}
        onFinish={onFinish}
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
              // Store the file directly in the form values - similar to HajjPackageForm
              form.setFieldsValue({ profile_picture_file: file });
              
              // Also store globally for backup
              window.uploadedPictureFile = file;
              
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
              loading={submitting}
              style={{ backgroundColor: '#9d277c', borderColor: '#9d277c' }}
            >
              {isEditMode ? 'Update User' : 'Create User'}
            </Button>
            <Button onClick={handleCancel}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UserForm; 