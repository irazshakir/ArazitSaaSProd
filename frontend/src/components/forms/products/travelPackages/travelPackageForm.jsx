import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Typography, Card, Alert, Affix, Space, Button, Spin, Form, Checkbox, Tag, Input } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
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

const TravelPackageForm = ({ 
  initialData = {},
  isEditMode = false,
  onSuccess
}) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [packageImage, setPackageImage] = useState(
    initialData?.image ? [
      {
        uid: '-1',
        name: initialData.image.split('/').pop() || 'package-image.jpg',
        status: 'done',
        url: initialData.image.startsWith('http') 
          ? initialData.image 
          : `${API_BASE_URL}${initialData.image}`
      }
    ] : []
  );
  const [placeTags, setPlaceTags] = useState(initialData?.place || []);
  const [placeInput, setPlaceInput] = useState('');
  const [placeInputVisible, setPlaceInputVisible] = useState(false);
  const [hotelBlocks, setHotelBlocks] = useState(
    initialData?.hotels?.length > 0 
      ? initialData.hotels 
      : [{ id: 1, ...initialData }]
  );
  const [flightBlocks, setFlightBlocks] = useState(
    initialData?.flights?.length > 0 
      ? initialData.flights 
      : [{ id: 1, ...initialData }]
  );
  const [transferBlocks, setTransferBlocks] = useState(
    initialData?.transfers?.length > 0 
      ? initialData.transfers 
      : [{ id: 1, ...initialData }]
  );
  
  // Form field options
  const options = {
    packageType: [
      { value: 'LOCAL', label: 'Local' },
      { value: 'INTERNATIONAL', label: 'International' }
    ],
    hotelStar: [
      { value: '5', label: '5 Star' },
      { value: '4', label: '4 Star' },
      { value: '3', label: '3 Star' },
      { value: 'ECONOMY', label: 'Economy' }
    ],
    roomType: [
      { value: 'PENTA', label: 'Penta' },
      { value: 'QUAD', label: 'Quad' },
      { value: 'TRIPLE', label: 'Triple' },
      { value: 'DOUBLE', label: 'Double' },
      { value: 'SHARING', label: 'Sharing' }
    ],
    transferType: [
      { value: 'BUS', label: 'Bus' },
      { value: 'COASTER', label: 'Coaster' },
      { value: 'HIACE', label: 'Hiace' },
      { value: 'SEDAN', label: 'Sedan' }
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
      packageName: initialData.packageName || '',
      is_group: initialData.is_group || false,
      packageType: initialData.packageType || 'LOCAL',
      place: initialData.place || {},
      travel_date: initialData.travel_date || null,
      return_date: initialData.return_date || null,
      flight_carrier: initialData.flight_carrier || {},
      is_hotel: initialData.is_hotel || false,
      is_flight: initialData.is_flight || false,
      is_transfers: initialData.is_transfers || false,
      package_cost: initialData.package_cost || 0,
      package_selling_price: initialData.package_selling_price || 0,
      
      // Hotel fields
      hotelName: initialData.hotelName || '',
      hotelPlace: initialData.hotelPlace || '',
      checkin_date: initialData.checkin_date || null,
      checkout_date: initialData.checkout_date || null,
      hotelStar: initialData.hotelStar || '3',
      room_type: initialData.room_type || 'DOUBLE',
      hotel_cost: initialData.hotel_cost || 0,
      hotel_selling_price: initialData.hotel_selling_price || 0,
      
      // Flight fields
      flight_carrier_name: initialData.flight_carrier_name || '',
      travel_from: initialData.travel_from || '',
      travel_to: initialData.travel_to || '',
      flight_cost: initialData.flight_cost || 0,
      flight_selling_price: initialData.flight_selling_price || 0,
      
      // Transfer fields
      transfer_type: initialData.transfer_type || 'BUS',
      transferPlace: initialData.transferPlace || '',
      transfer_cost: initialData.transfer_cost || 0,
      transfer_selling_price: initialData.transfer_selling_price || 0
    },
    {
      packageName: { required: true },
      packageType: { required: true },
      travel_date: { required: true },
      return_date: { required: true },
      package_cost: { required: true, min: 0 },
      package_selling_price: { required: true, min: 0 }
    }
  );

  // Handle image change
  const handleImageChange = (fileList) => {
    setPackageImage(fileList);
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      setFieldValue('image', file);
    } else {
      setFieldValue('image', null);
    }
  };

  // Format date for API
  const formatDate = (date) => {
    if (!date) return null;
    if (typeof date === 'string') return date;
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return null;
  };

  // Handle place tag input
  const handlePlaceInputConfirm = () => {
    if (placeInput && !placeTags.includes(placeInput)) {
      setPlaceTags([...placeTags, placeInput]);
      setFieldValue('place', [...placeTags, placeInput]);
    }
    setPlaceInput('');
    setPlaceInputVisible(false);
  };

  const removePlaceTag = (removedTag) => {
    const newTags = placeTags.filter(tag => tag !== removedTag);
    setPlaceTags(newTags);
    setFieldValue('place', newTags);
  };

  // Add new hotel block
  const addHotelBlock = () => {
    const newBlock = {
      id: hotelBlocks.length + 1,
      hotelName: '',
      hotelPlace: '',
      checkin_date: null,
      checkout_date: null,
      hotelStar: '3',
      room_type: 'DOUBLE',
      hotel_cost: 0,
      hotel_selling_price: 0
    };
    setHotelBlocks([...hotelBlocks, newBlock]);
  };

  // Remove hotel block
  const removeHotelBlock = (id) => {
    setHotelBlocks(hotelBlocks.filter(block => block.id !== id));
  };

  // Add new flight block
  const addFlightBlock = () => {
    const newBlock = {
      id: flightBlocks.length + 1,
      flight_carrier_name: '',
      travel_from: '',
      travel_to: '',
      flight_cost: 0,
      flight_selling_price: 0
    };
    setFlightBlocks([...flightBlocks, newBlock]);
  };

  // Remove flight block
  const removeFlightBlock = (id) => {
    setFlightBlocks(flightBlocks.filter(block => block.id !== id));
  };

  // Add new transfer block
  const addTransferBlock = () => {
    const newBlock = {
      id: transferBlocks.length + 1,
      transfer_type: 'BUS',
      transferPlace: '',
      transfer_cost: 0,
      transfer_selling_price: 0
    };
    setTransferBlocks([...transferBlocks, newBlock]);
  };

  // Remove transfer block
  const removeTransferBlock = (id) => {
    setTransferBlocks(transferBlocks.filter(block => block.id !== id));
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user info
      const userInfo = localStorage.getItem('user');
      let userId = null;
      let tenantId = null;
      
      // Get tenant ID from various possible locations
      tenantId = localStorage.getItem('tenant_id') || 
                 sessionStorage.getItem('tenant_id');
      
      if (userInfo) {
        try {
          const parsedUser = JSON.parse(userInfo);
          userId = parsedUser.id;
          if (!tenantId) {
            tenantId = parsedUser.tenant_id || 
                      parsedUser.tenant || 
                      (parsedUser.tenant_users && parsedUser.tenant_users[0]?.tenant);
          }
        } catch (e) {
          console.error('Error parsing user info:', e);
        }
      }

      // Create data object
      const formData = new FormData();
      
      // Add basic package information
      formData.append('packageName', values.packageName);
      formData.append('is_group', values.is_group);
      formData.append('packageType', values.packageType);
      formData.append('place', JSON.stringify(placeTags));
      formData.append('travel_date', formatDate(values.travel_date));
      formData.append('return_date', formatDate(values.return_date));
      formData.append('is_hotel', values.is_hotel);
      formData.append('is_flight', values.is_flight);
      formData.append('is_transfers', values.is_transfers);
      formData.append('package_cost', values.package_cost);
      formData.append('package_selling_price', values.package_selling_price);
      formData.append('notes', values.notes);
      
      // Add hotel information if included
      if (values.is_hotel) {
        formData.append('hotels', JSON.stringify(hotelBlocks));
      }
      
      // Add flight information if included
      if (values.is_flight) {
        formData.append('flights', JSON.stringify(flightBlocks));
      }
      
      // Add transfer information if included
      if (values.is_transfers) {
        formData.append('transfers', JSON.stringify(transferBlocks));
      }
      
      // Add image if available
      if (packageImage.length > 0 && packageImage[0].originFileObj) {
        formData.append('image', packageImage[0].originFileObj);
      }
      
      // Get auth token
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Prepare endpoint
      const endpoint = isEditMode 
        ? `${API_BASE_URL}${API_ENDPOINTS.TRAVEL_PACKAGES.DETAIL(initialData.id)}` 
        : `${API_BASE_URL}${API_ENDPOINTS.TRAVEL_PACKAGES.LIST}`;
      
      // Make API request
      const response = await axios({
        method: isEditMode ? 'PUT' : 'POST',
        url: endpoint,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        data: formData
      });
      
      if (!isEditMode) resetForm();
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (error) {
      let errorMessage = 'An error occurred while saving the package';
      
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
    navigate('/dashboard/travel/travel-packages');
  };
  
  return (
    <div className="travel-package-form">
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
        name="travel_package_form"
      >
        <Row gutter={24}>
          {/* Left Container - Main Form */}
          <Col xs={24} lg={16}>
            {/* Basic Information Section */}
            <FormSection title="Basic Information">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <FormTextInput
                    label="Package Name"
                    name="packageName"
                    value={values.packageName}
                    onChange={(value) => handleChange('packageName', value)}
                    onBlur={() => handleBlur('packageName')}
                    error={touched.packageName && errors.packageName}
                    required
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormSelect
                    label="Package Type"
                    name="packageType"
                    value={values.packageType}
                    onChange={(value) => handleChange('packageType', value)}
                    options={options.packageType}
                    required
                  />
                </Col>
                <Col xs={24}>
                  <Form.Item label="Places">
                    <div>
                      {placeTags.map((tag, index) => (
                        <Tag
                          key={index}
                          closable
                          onClose={() => removePlaceTag(tag)}
                        >
                          {tag}
                        </Tag>
                      ))}
                      {placeInputVisible && (
                        <Input
                          type="text"
                          size="small"
                          style={{ width: 78 }}
                          value={placeInput}
                          onChange={(e) => setPlaceInput(e.target.value)}
                          onBlur={handlePlaceInputConfirm}
                          onPressEnter={handlePlaceInputConfirm}
                        />
                      )}
                      {!placeInputVisible && (
                        <Tag
                          onClick={() => setPlaceInputVisible(true)}
                          style={{ background: '#fff', borderStyle: 'dashed' }}
                        >
                          <PlusOutlined /> New Place
                        </Tag>
                      )}
                    </div>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item>
                    <Checkbox
                      checked={values.is_hotel}
                      onChange={(e) => handleChange('is_hotel', e.target.checked)}
                    >
                      Include Hotel
                    </Checkbox>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item>
                    <Checkbox
                      checked={values.is_flight}
                      onChange={(e) => handleChange('is_flight', e.target.checked)}
                    >
                      Include Flight
                    </Checkbox>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item>
                    <Checkbox
                      checked={values.is_transfers}
                      onChange={(e) => handleChange('is_transfers', e.target.checked)}
                    >
                      Include Transfers
                    </Checkbox>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <FormDatePicker
                    label="Travel Date"
                    name="travel_date"
                    value={values.travel_date}
                    onChange={(value) => handleChange('travel_date', value)}
                    required
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormDatePicker
                    label="Return Date"
                    name="return_date"
                    value={values.return_date}
                    onChange={(value) => handleChange('return_date', value)}
                    required
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormNumberInput
                    label="Package Cost"
                    name="package_cost"
                    value={values.package_cost}
                    onChange={(value) => handleChange('package_cost', value)}
                    min={0}
                    required
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormNumberInput
                    label="Selling Price"
                    name="package_selling_price"
                    value={values.package_selling_price}
                    onChange={(value) => handleChange('package_selling_price', value)}
                    min={0}
                    required
                  />
                </Col>
              </Row>
            </FormSection>
            
            {/* Hotel Information Section */}
            {values.is_hotel && (
              <FormSection title="Hotel Information">
                {hotelBlocks.map((block, index) => (
                  <Card 
                    key={block.id}
                    style={{ marginBottom: 16 }}
                    extra={
                      hotelBlocks.length > 1 && (
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={() => removeHotelBlock(block.id)}
                        />
                      )
                    }
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <FormTextInput
                          label="Hotel Name"
                          name={`hotelName_${block.id}`}
                          value={block.hotelName}
                          onChange={(value) => {
                            const updatedBlocks = hotelBlocks.map(b => 
                              b.id === block.id ? { ...b, hotelName: value } : b
                            );
                            setHotelBlocks(updatedBlocks);
                          }}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <FormTextInput
                          label="Hotel Place"
                          name={`hotelPlace_${block.id}`}
                          value={block.hotelPlace}
                          onChange={(value) => {
                            const updatedBlocks = hotelBlocks.map(b => 
                              b.id === block.id ? { ...b, hotelPlace: value } : b
                            );
                            setHotelBlocks(updatedBlocks);
                          }}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <FormDatePicker
                          label="Check In"
                          name={`checkin_date_${block.id}`}
                          value={block.checkin_date}
                          onChange={(value) => {
                            const updatedBlocks = hotelBlocks.map(b => 
                              b.id === block.id ? { ...b, checkin_date: value } : b
                            );
                            setHotelBlocks(updatedBlocks);
                          }}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <FormDatePicker
                          label="Check Out"
                          name={`checkout_date_${block.id}`}
                          value={block.checkout_date}
                          onChange={(value) => {
                            const updatedBlocks = hotelBlocks.map(b => 
                              b.id === block.id ? { ...b, checkout_date: value } : b
                            );
                            setHotelBlocks(updatedBlocks);
                          }}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <FormSelect
                          label="Hotel Star"
                          name={`hotelStar_${block.id}`}
                          value={block.hotelStar}
                          onChange={(value) => {
                            const updatedBlocks = hotelBlocks.map(b => 
                              b.id === block.id ? { ...b, hotelStar: value } : b
                            );
                            setHotelBlocks(updatedBlocks);
                          }}
                          options={options.hotelStar}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <FormSelect
                          label="Room Type"
                          name={`room_type_${block.id}`}
                          value={block.room_type}
                          onChange={(value) => {
                            const updatedBlocks = hotelBlocks.map(b => 
                              b.id === block.id ? { ...b, room_type: value } : b
                            );
                            setHotelBlocks(updatedBlocks);
                          }}
                          options={options.roomType}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <FormNumberInput
                          label="Hotel Cost"
                          name={`hotel_cost_${block.id}`}
                          value={block.hotel_cost}
                          onChange={(value) => {
                            const updatedBlocks = hotelBlocks.map(b => 
                              b.id === block.id ? { ...b, hotel_cost: value } : b
                            );
                            setHotelBlocks(updatedBlocks);
                          }}
                          min={0}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <FormNumberInput
                          label="Hotel Selling Price"
                          name={`hotel_selling_price_${block.id}`}
                          value={block.hotel_selling_price}
                          onChange={(value) => {
                            const updatedBlocks = hotelBlocks.map(b => 
                              b.id === block.id ? { ...b, hotel_selling_price: value } : b
                            );
                            setHotelBlocks(updatedBlocks);
                          }}
                          min={0}
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button 
                  type="dashed" 
                  onClick={addHotelBlock}
                  icon={<PlusOutlined />}
                  style={{ width: '100%' }}
                >
                  Add Another Hotel
                </Button>
              </FormSection>
            )}
            
            {/* Flight Information Section */}
            {values.is_flight && (
              <FormSection title="Flight Information">
                {flightBlocks.map((block, index) => (
                  <Card 
                    key={block.id}
                    style={{ marginBottom: 16 }}
                    extra={
                      flightBlocks.length > 1 && (
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={() => removeFlightBlock(block.id)}
                        />
                      )
                    }
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <FormTextInput
                          label="Flight Carrier"
                          name={`flight_carrier_name_${block.id}`}
                          value={block.flight_carrier_name}
                          onChange={(value) => {
                            const updatedBlocks = flightBlocks.map(b => 
                              b.id === block.id ? { ...b, flight_carrier_name: value } : b
                            );
                            setFlightBlocks(updatedBlocks);
                          }}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <FormTextInput
                          label="Travel From"
                          name={`travel_from_${block.id}`}
                          value={block.travel_from}
                          onChange={(value) => {
                            const updatedBlocks = flightBlocks.map(b => 
                              b.id === block.id ? { ...b, travel_from: value } : b
                            );
                            setFlightBlocks(updatedBlocks);
                          }}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <FormTextInput
                          label="Travel To"
                          name={`travel_to_${block.id}`}
                          value={block.travel_to}
                          onChange={(value) => {
                            const updatedBlocks = flightBlocks.map(b => 
                              b.id === block.id ? { ...b, travel_to: value } : b
                            );
                            setFlightBlocks(updatedBlocks);
                          }}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <FormNumberInput
                          label="Flight Cost"
                          name={`flight_cost_${block.id}`}
                          value={block.flight_cost}
                          onChange={(value) => {
                            const updatedBlocks = flightBlocks.map(b => 
                              b.id === block.id ? { ...b, flight_cost: value } : b
                            );
                            setFlightBlocks(updatedBlocks);
                          }}
                          min={0}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <FormNumberInput
                          label="Flight Selling Price"
                          name={`flight_selling_price_${block.id}`}
                          value={block.flight_selling_price}
                          onChange={(value) => {
                            const updatedBlocks = flightBlocks.map(b => 
                              b.id === block.id ? { ...b, flight_selling_price: value } : b
                            );
                            setFlightBlocks(updatedBlocks);
                          }}
                          min={0}
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button 
                  type="dashed" 
                  onClick={addFlightBlock}
                  icon={<PlusOutlined />}
                  style={{ width: '100%' }}
                >
                  Add Another Flight
                </Button>
              </FormSection>
            )}
            
            {/* Transfer Information Section */}
            {values.is_transfers && (
              <FormSection title="Transfer Information">
                {transferBlocks.map((block, index) => (
                  <Card 
                    key={block.id}
                    style={{ marginBottom: 16 }}
                    extra={
                      transferBlocks.length > 1 && (
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={() => removeTransferBlock(block.id)}
                        />
                      )
                    }
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <FormSelect
                          label="Transfer Type"
                          name={`transfer_type_${block.id}`}
                          value={block.transfer_type}
                          onChange={(value) => {
                            const updatedBlocks = transferBlocks.map(b => 
                              b.id === block.id ? { ...b, transfer_type: value } : b
                            );
                            setTransferBlocks(updatedBlocks);
                          }}
                          options={options.transferType}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <FormTextInput
                          label="Transfer Place"
                          name={`transferPlace_${block.id}`}
                          value={block.transferPlace}
                          onChange={(value) => {
                            const updatedBlocks = transferBlocks.map(b => 
                              b.id === block.id ? { ...b, transferPlace: value } : b
                            );
                            setTransferBlocks(updatedBlocks);
                          }}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <FormNumberInput
                          label="Transfer Cost"
                          name={`transfer_cost_${block.id}`}
                          value={block.transfer_cost}
                          onChange={(value) => {
                            const updatedBlocks = transferBlocks.map(b => 
                              b.id === block.id ? { ...b, transfer_cost: value } : b
                            );
                            setTransferBlocks(updatedBlocks);
                          }}
                          min={0}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <FormNumberInput
                          label="Transfer Selling Price"
                          name={`transfer_selling_price_${block.id}`}
                          value={block.transfer_selling_price}
                          onChange={(value) => {
                            const updatedBlocks = transferBlocks.map(b => 
                              b.id === block.id ? { ...b, transfer_selling_price: value } : b
                            );
                            setTransferBlocks(updatedBlocks);
                          }}
                          min={0}
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button 
                  type="dashed" 
                  onClick={addTransferBlock}
                  icon={<PlusOutlined />}
                  style={{ width: '100%' }}
                >
                  Add Another Transfer
                </Button>
              </FormSection>
            )}
          </Col>
          
          {/* Right Container - Sidebar */}
          <Col xs={24} lg={8}>
            {/* Package Image Upload */}
            <UploadIcon
              title="Package Image"
              accept="image/*"
              maxCount={1}
              buttonText="Upload Image"
              onChange={handleImageChange}
              fileList={packageImage}
            />
            
            {/* Additional Information Card */}
            <Card title="Additional Information" style={{ marginBottom: 24 }}>
              <FormTextarea
                label="Notes"
                name="notes"
                value={values.notes}
                onChange={(value) => handleChange('notes', value)}
                rows={4}
              />
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
              onClick={handleCancel}
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

export default TravelPackageForm;
