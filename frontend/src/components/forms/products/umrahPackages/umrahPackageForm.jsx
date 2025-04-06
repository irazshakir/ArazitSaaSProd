import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Typography, Card, Alert, Affix, Space, Button, Spin, Form } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../../../services/api';
import { API_BASE_URL, API_ENDPOINTS } from '../../../../config/api';
import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import { notification } from 'antd';

// Common form components
import FormTextInput from '../../common/formTextInput';
import FormTextarea from '../../common/formTextarea';
import FormSelect from '../../common/formSelect';
import FormNumberInput from '../../common/formNumberInput';
import FormDatePicker from '../../common/formDatePicker';
import FormSection from '../../common/formSection';
import FormActions from '../../common/formActions';
import FormRadioGroup from '../../common/formRadioGroup';
import UploadIcon from '../../common/uploadIcon';

// Utilities
import useFormValidation from '../../common/useFormValidation';

const { Title, Text } = Typography;

/**
 * Form component for creating and editing Umrah packages
 * @param {object} initialData - Initial package data (for editing)
 * @param {boolean} isEditMode - Whether the form is in edit mode
 * @param {function} onSuccess - Function to call after successful form submission
 */
const UmrahPackageForm = ({ 
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
  const [hotelModalVisible, setHotelModalVisible] = useState(false);
  const [editingHotelIndex, setEditingHotelIndex] = useState(null);
  const [currentHotelData, setCurrentHotelData] = useState({});
  const [hotels, setHotels] = useState(initialData?.hotels || []);
  
  // Options for select fields
  const visaOptions = [
    { value: 'included', label: 'Included' },
    { value: 'not_included', label: 'Not Included' }
  ];
  
  const transportationOptions = [
    { value: 'included', label: 'Included' },
    { value: 'not_included', label: 'Not Included' }
  ];
  
  const vehicleTypeOptions = [
    { value: 'coaster', label: 'Coaster' },
    { value: 'bus', label: 'Bus' },
    { value: 'SUV', label: 'SUV' },
    { value: 'sedan', label: 'Sedan' },
    { value: 'van', label: 'Van' },
    { value: 'ministry_approved_bus', label: 'Ministry Approved Bus' }
  ];
  
  const ziyaratOptions = [
    { value: 'makkah_madinah', label: 'Makkah & Madinah' },
    { value: 'makkah_only', label: 'Makkah Only' },
    { value: 'madinah_only', label: 'Madinah Only' },
    { value: 'not_included', label: 'Not Included' }
  ];
  
  const cityOptions = [
    { value: 'Makkah', label: 'Makkah' },
    { value: 'Madinah', label: 'Madinah' }
  ];
  
  const activeOptions = [
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' }
  ];
  
  const starOptions = [
    { value: '5', label: '5 Star' },
    { value: '4', label: '4 Star' },
    { value: '3', label: '3 Star' },
    { value: '2', label: '2 Star' },
    { value: 'economy', label: 'Economy' },
    { value: 'sharing', label: 'Sharing' }
  ];
  
  const roomTypeOptions = [
    { value: 'Double', label: 'Double' },
    { value: 'Triple', label: 'Triple' },
    { value: 'Quad', label: 'Quad' },
    { value: 'Penta', label: 'Penta' },
    { value: 'Hexa', label: 'Hexa' },
    { value: 'Economy', label: 'Economy' },
    { value: 'Sharing', label: 'Sharing' }
  ];
  
  // Initialize form state with default values or provided initialData
  const initialFormValues = {
    package_name: initialData.package_name || '',
    is_active: initialData.is_active !== undefined ? initialData.is_active : true,
    visa: initialData.visa || 'included',
    transportation: initialData.transportation || 'included',
    vehicle_type: initialData.vehicle_type || '',
    flight_carrier: initialData.flight_carrier || '',
    ziyarat: initialData.ziyarat || 'makkah_madinah',
    package_star: initialData.package_star || '5',
    umrah_days: initialData.umrah_days || 14,
    departure_date: initialData.departure_date ? new Date(initialData.departure_date) : null,
    return_date: initialData.return_date ? new Date(initialData.return_date) : null,
    total_cost: initialData.total_cost || 0,
    selling_price: initialData.selling_price || 0,
    tags: initialData.tags || [],
    image: initialData.image || null
  };
  
  // Validation rules for form fields
  const validationRules = {
    package_name: {
      required: 'Package name is required',
      minLength: 3,
      maxLength: 255
    },
    package_star: {
      required: 'Star rating is required'
    },
    umrah_days: {
      required: 'Number of days is required',
      min: 1
    },
    departure_date: {
      required: 'Departure date is required'
    },
    return_date: {
      required: 'Return date is required',
      validate: (value, values) => {
        if (values.departure_date && value < values.departure_date) {
          return 'Return date must be after departure date';
        }
        return null;
      }
    },
    total_cost: {
      required: 'Total cost is required',
      min: 0
    },
    selling_price: {
      required: 'Selling price is required',
      min: 0
    }
  };
  
  // Hook for form validation
  const { 
    values, 
    errors, 
    handleChange, 
    handleBlur, 
    validateForm, 
    setValues 
  } = useFormValidation(initialFormValues, validationRules);
  
  // Load hotels from initialData if available
  useEffect(() => {
    if (initialData.hotels && initialData.hotels.length > 0) {
      setHotels(initialData.hotels);
    }
  }, [initialData]);
  
  // Handle image change
  const handleImageChange = (fileList) => {
    setPackageImage(fileList);
  };
  
  // Format date for API submission
  const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    
    try {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };
  
  // Handle adding a new hotel
  const handleAddHotel = () => {
    const newHotels = [...hotels];
    newHotels.push({
      id: uuid(),
      hotel_name: '',
      hotel_city: 'Makkah',
      checkin_date: null,
      checkout_date: null,
      hotel_star: '',
      hotel_room_type: '',
      no_of_nights: 0,
      buying_cost: 0,
      selling_cost: 0,
    });
    setHotels(newHotels);
  };
  
  // Handle removing a hotel
  const handleRemoveHotel = (index) => {
    const newHotels = [...hotels];
    newHotels.splice(index, 1);
    setHotels(newHotels);
  };
  
  // Handle hotel form field changes
  const handleHotelChange = (index, field, value) => {
    const newHotels = [...hotels];
    newHotels[index][field] = value;

    // Calculate nights when dates change
    if (field === 'checkin_date' || field === 'checkout_date') {
      const checkIn = field === 'checkin_date' ? value : newHotels[index].checkin_date;
      const checkOut = field === 'checkout_date' ? value : newHotels[index].checkout_date;
      
      if (checkIn && checkOut) {
        const checkInDate = dayjs(checkIn);
        const checkOutDate = dayjs(checkOut);
        const nights = checkOutDate.diff(checkInDate, 'day');
        
        if (nights > 0) {
          newHotels[index].no_of_nights = nights;
        }
      }
    }
    
    setHotels(newHotels);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate form
      if (!values.package_name || !values.package_star || !values.umrah_days || 
          !values.departure_date || !values.return_date || 
          !values.total_cost || !values.selling_price) {
        setError({ message: 'Please fill in all required fields.' });
        return;
      }

      if (hotels.length === 0) {
        setError({ message: 'Please add at least one hotel.' });
        return;
      }

      // Validate each hotel
      for (const hotel of hotels) {
        if (!hotel.hotel_name || !hotel.hotel_city || !hotel.checkin_date || 
            !hotel.checkout_date || !hotel.hotel_star || !hotel.hotel_room_type || 
            !hotel.no_of_nights) {
          setError({ message: 'Please complete all hotel information.' });
          return;
        }
      }

      setIsLoading(true);
      setError(null);
      
      // Get tenant ID from session storage or user data
      const currentTenant = JSON.parse(sessionStorage.getItem('currentTenant') || '{}');
      let tenantId = null;
      
      if (currentTenant && currentTenant.id) {
        tenantId = currentTenant.id;
        console.log('Using tenant ID:', tenantId);
      } else {
        // Try to get tenant ID from user data in localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.tenant_id) {
          tenantId = userData.tenant_id;
          console.log('Using tenant ID from user data:', tenantId);
        } else {
          console.error('No tenant ID found in session or user data');
          setError({
            message: 'Tenant information is missing',
            description: 'Please log out and log back in to restore your tenant information.'
          });
          setIsLoading(false);
          return;
        }
      }
      
      const formData = new FormData();
      formData.append('package_name', values.package_name);
      formData.append('visa', values.visa);
      formData.append('transportation', values.transportation);
      if (values.transportation === 'included' && values.vehicle_type) {
        formData.append('vehicle_type', values.vehicle_type);
      }
      if (values.flight_carrier) {
        formData.append('flight_carrier', values.flight_carrier);
      }
      formData.append('ziyarat', values.ziyarat);
      formData.append('package_star', values.package_star);
      formData.append('umrah_days', values.umrah_days);
      formData.append('departure_date', formatDate(values.departure_date));
      formData.append('return_date', formatDate(values.return_date));
      formData.append('total_cost', values.total_cost);
      formData.append('selling_price', values.selling_price);
      formData.append('is_active', String(values.is_active));
      
      // Add tenant ID to the form data
      formData.append('tenant', tenantId);
      
      if (packageImage && packageImage[0]?.originFileObj) {
        formData.append('image', packageImage[0].originFileObj);
      }

      // Debug log of all form values being sent
      console.log('Submitting form data:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? `File: ${value.name}` : value}`);
      }
      
      let response;
      
      try {
        if (isEditMode) {
          // Update existing package
          console.log(`Sending PUT request to /umrah-packages/${initialData.id}/`);
          response = await api.put(`/umrah-packages/${initialData.id}/`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            }
          });
          console.log('Update response:', response.data);
          
          // Handle hotels
          const existingHotels = initialData.hotels || [];
          const existingHotelIds = existingHotels.map(h => h.id);
          const currentHotelIds = hotels.filter(h => h.id && typeof h.id === 'string' && h.id.length > 10).map(h => h.id);
          
          // Create or update hotels
          for (const hotel of hotels) {
            const hotelData = {
              hotel_name: hotel.hotel_name,
              hotel_city: hotel.hotel_city,
              checkin_date: formatDate(hotel.checkin_date),
              checkout_date: formatDate(hotel.checkout_date),
              hotel_star: hotel.hotel_star,
              hotel_room_type: hotel.hotel_room_type,
              no_of_nights: hotel.no_of_nights,
              buying_cost: hotel.buying_cost,
              selling_cost: hotel.selling_cost,
              umrah_package: initialData.id
            };
            
            console.log('Hotel data:', hotelData);
            
            if (hotel.id && typeof hotel.id === 'string' && hotel.id.length > 10 && existingHotelIds.includes(hotel.id)) {
              // Update existing hotel
              console.log(`Updating hotel ${hotel.id}`);
              await api.put(`/umrah-hotels/${hotel.id}/`, hotelData);
            } else {
              // Create new hotel
              console.log('Creating new hotel');
              await api.post('/umrah-hotels/', hotelData);
            }
          }
          
          // Delete hotels that were removed
          for (const hotelId of existingHotelIds) {
            if (!currentHotelIds.includes(hotelId)) {
              console.log(`Deleting hotel ${hotelId}`);
              await api.delete(`/umrah-hotels/${hotelId}/`);
            }
          }
        } else {
          // Create new package
          console.log('Sending POST request to /umrah-packages/');
          
          // For debugging - create a JSON object to inspect what's being sent
          const requestData = {};
          for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
              requestData[key] = `[File: ${value.name}]`;
            } else {
              requestData[key] = value;
            }
          }
          console.log('Request data as JSON:', requestData);
          
          response = await api.post('/umrah-packages/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            }
          });
          console.log('Create response:', response.data);
          
          // Create hotels for new package
          for (const hotel of hotels) {
            const hotelData = {
              hotel_name: hotel.hotel_name,
              hotel_city: hotel.hotel_city,
              checkin_date: formatDate(hotel.checkin_date),
              checkout_date: formatDate(hotel.checkout_date),
              hotel_star: hotel.hotel_star,
              hotel_room_type: hotel.hotel_room_type,
              no_of_nights: hotel.no_of_nights,
              buying_cost: hotel.buying_cost,
              selling_cost: hotel.selling_cost,
              umrah_package: response.data.id
            };
            
            console.log('Creating hotel with data:', hotelData);
            await api.post('/umrah-hotels/', hotelData);
          }
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
        console.error('Error response data:', apiError.response?.data);
        throw apiError;
      }
      
      // Success notification
      notification.success({
        message: `Package ${isEditMode ? 'Updated' : 'Created'} Successfully`,
        description: `"${values.package_name}" has been ${isEditMode ? 'updated' : 'created'} successfully.`,
      });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Navigate back
      navigate('/dashboard/hajj-umrah/umrah-packages');
    } catch (err) {
      console.error('Error submitting form:', err);
      const errorDetails = err.response?.data;
      console.error('Error response details:', errorDetails);
      
      let errorMessage = 'An error occurred while saving the package.';
      let errorDescription = err.message;
      
      if (errorDetails) {
        if (typeof errorDetails === 'string') {
          errorDescription = errorDetails;
        } else if (typeof errorDetails === 'object') {
          // Format field-specific errors
          errorDescription = Object.entries(errorDetails)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              } else {
                return `${field}: ${errors}`;
              }
            })
            .join('\n');
        }
      }
      
      setError({
        message: errorMessage,
        description: errorDescription
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle cancel button
  const handleCancel = () => {
    navigate('/dashboard/hajj-umrah/umrah-packages');
  };
  
  return (
    <div className="umrah-package-form">
      {error && (
        <Alert
          message="Error"
          description={
            <div>
              <p>{error.message}</p>
              {error.description && (
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem', marginTop: 10 }}>
                  {error.description}
                </div>
              )}
            </div>
          }
          type="error" 
          showIcon 
          style={{ marginBottom: 24 }}
        />
      )}
      
      <Form
        layout="vertical"
        initialValues={initialData}
        name="umrah_package_form"
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
                    name="package_name"
                    value={values.package_name}
                    onChange={(value) => handleChange('package_name', value)}
                    onBlur={() => handleBlur('package_name')}
                    error={errors.package_name}
                    placeholder="Enter package name"
                    required
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormSelect
                    label="Status"
                    name="is_active"
                    value={values.is_active}
                    onChange={(value) => handleChange('is_active', value)}
                    options={activeOptions}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormSelect
                    label="Visa"
                    name="visa"
                    value={values.visa}
                    onChange={(value) => handleChange('visa', value)}
                    options={visaOptions}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormSelect
                    label="Ziyarat"
                    name="ziyarat"
                    value={values.ziyarat}
                    onChange={(value) => handleChange('ziyarat', value)}
                    options={ziyaratOptions}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormSelect
                    label="Transportation"
                    name="transportation"
                    value={values.transportation}
                    onChange={(value) => handleChange('transportation', value)}
                    options={transportationOptions}
                  />
                </Col>
                {values.transportation === 'included' && (
                  <Col xs={24} md={12}>
                    <FormSelect
                      label="Vehicle Type"
                      name="vehicle_type"
                      value={values.vehicle_type}
                      onChange={(value) => handleChange('vehicle_type', value)}
                      options={vehicleTypeOptions}
                    />
                  </Col>
                )}
                <Col xs={24} md={12}>
                  <FormTextInput
                    label="Flight Carrier"
                    name="flight_carrier"
                    value={values.flight_carrier}
                    onChange={(value) => handleChange('flight_carrier', value)}
                    placeholder="Enter flight carrier name"
                  />
                </Col>
              </Row>
            </FormSection>
            
            {/* Umrah Details Section */}
            <FormSection title="Umrah Details">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <FormSelect
                    label="Package Star"
                    name="package_star"
                    value={values.package_star}
                    onChange={(value) => handleChange('package_star', value)}
                    options={starOptions}
                    required
                    error={errors.package_star}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormNumberInput
                    label="Umrah Days"
                    name="umrah_days"
                    value={values.umrah_days}
                    onChange={(value) => handleChange('umrah_days', value)}
                    min={1}
                    required
                    error={errors.umrah_days}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormDatePicker
                    label="Departure"
                    name="departure_date"
                    value={values.departure_date}
                    onChange={(value) => handleChange('departure_date', value)}
                    required
                    error={errors.departure_date}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormDatePicker
                    label="Return"
                    name="return_date"
                    value={values.return_date}
                    onChange={(value) => handleChange('return_date', value)}
                    required
                    error={errors.return_date}
                    minDate={values.departure_date}
                  />
                </Col>
              </Row>
            </FormSection>
            
            {/* Accommodation Details Section */}
            <FormSection title="Accommodation Details">
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} md={24}>
                  <Button 
                    type="primary" 
                    onClick={handleAddHotel}
                    style={{ marginBottom: 16 }}
                  >
                    Add Hotel
                  </Button>
                  
                  {hotels.length === 0 ? (
                    <Alert
                      message="No Hotels Added"
                      description="Please add at least one hotel for this package."
                      type="info"
                      showIcon
                    />
                  ) : (
                    hotels.map((hotel, index) => (
                      <Card 
                        title={`Hotel ${index + 1}`} 
                        key={hotel.id || index}
                        extra={
                          <Button 
                            danger 
                            onClick={() => handleRemoveHotel(index)}
                            icon={<DeleteOutlined />}
                          >
                            Remove
                          </Button>
                        }
                        style={{ marginBottom: 16 }}
                      >
                        <Row gutter={[16, 16]}>
                          <Col xs={24} md={12}>
                            <FormTextInput
                              label="Hotel Name"
                              name={`hotel_name_${index}`}
                              value={hotel.hotel_name}
                              onChange={(value) => handleHotelChange(index, 'hotel_name', value)}
                              placeholder="Enter hotel name"
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <FormSelect
                              label="City"
                              name={`hotel_city_${index}`}
                              value={hotel.hotel_city}
                              onChange={(value) => handleHotelChange(index, 'hotel_city', value)}
                              options={cityOptions}
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <FormDatePicker
                              label="Check-in Date"
                              name={`checkin_date_${index}`}
                              value={hotel.checkin_date}
                              onChange={(value) => handleHotelChange(index, 'checkin_date', value)}
                              minDate={values.departure_date ? dayjs(values.departure_date) : undefined}
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <FormDatePicker
                              label="Check-out Date"
                              name={`checkout_date_${index}`}
                              value={hotel.checkout_date}
                              onChange={(value) => handleHotelChange(index, 'checkout_date', value)}
                              minDate={hotel.checkin_date ? dayjs(hotel.checkin_date).add(1, 'day') : undefined}
                            />
                          </Col>
                          <Col xs={24} md={8}>
                            <FormSelect
                              label="Hotel Star Rating"
                              name={`hotel_star_${index}`}
                              value={hotel.hotel_star}
                              onChange={(value) => handleHotelChange(index, 'hotel_star', value)}
                              options={starOptions}
                            />
                          </Col>
                          <Col xs={24} md={8}>
                            <FormSelect
                              label="Room Type"
                              name={`hotel_room_type_${index}`}
                              value={hotel.hotel_room_type}
                              onChange={(value) => handleHotelChange(index, 'hotel_room_type', value)}
                              options={roomTypeOptions}
                            />
                          </Col>
                          <Col xs={24} md={8}>
                            <FormNumberInput
                              label="Nights"
                              name={`no_of_nights_${index}`}
                              value={hotel.no_of_nights}
                              onChange={(value) => handleHotelChange(index, 'no_of_nights', value)}
                              min={0}
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <FormNumberInput
                              label="Buying Cost"
                              name={`buying_cost_${index}`}
                              value={hotel.buying_cost}
                              onChange={(value) => handleHotelChange(index, 'buying_cost', value)}
                              min={0}
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <FormNumberInput
                              label="Selling Cost"
                              name={`selling_cost_${index}`}
                              value={hotel.selling_cost}
                              onChange={(value) => handleHotelChange(index, 'selling_cost', value)}
                              min={0}
                            />
                          </Col>
                        </Row>
                      </Card>
                    ))
                  )}
                </Col>
              </Row>
            </FormSection>
            
            {/* Pricing Section */}
            <FormSection title="Pricing Details">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <FormNumberInput
                    label="Total Cost"
                    name="total_cost"
                    value={values.total_cost}
                    onChange={(value) => handleChange('total_cost', value)}
                    min={0}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <FormNumberInput
                    label="Selling Price"
                    name="selling_price"
                    value={values.selling_price}
                    onChange={(value) => handleChange('selling_price', value)}
                    min={0}
                  />
                </Col>
              </Row>
            </FormSection>
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
              initialValue={initialData?.image ? [
                {
                  uid: '-1',
                  name: initialData.image.split('/').pop() || 'package-image.jpg',
                  status: 'done',
                  url: initialData.image.startsWith('http') 
                    ? initialData.image 
                    : `${API_BASE_URL}${initialData.image}`
                }
              ] : []}
            />
            
            {/* Additional Information Card */}
            <Card title="Additional Information" style={{ marginBottom: 24 }}>
              <p>You can add more details about the package here.</p>
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
              onClick={() => navigate('/dashboard/hajj-umrah/umrah-packages')} 
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

export default UmrahPackageForm;
