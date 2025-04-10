import React, { useState, useEffect } from 'react';
import { Grid, Typography, Paper, Box, Button, IconButton } from '@mui/material';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col, Divider } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

const FlightForm = ({ form, formValues, handleInputChange }) => {
  // Initialize state from formValues with proper defaults for all fields
  const [passengers, setPassengers] = useState(formValues.passenger_details || []);
  const [costDetails, setCostDetails] = useState({
    adult_price: formValues.cost_details?.adult_price || 0,
    child_price: formValues.cost_details?.child_price || 0,
    infant_price: formValues.cost_details?.infant_price || 0,
    total_cost: formValues.cost_details?.total_cost || 0,
    total_sell: formValues.cost_details?.total_sell || 0,
    total_profit: formValues.cost_details?.total_profit || 0,
    ...formValues.cost_details
  });

  // Update local state when formValues change (useful for edit mode)
  useEffect(() => {
    if (formValues.passenger_details) {
      setPassengers(formValues.passenger_details);
    }
    
    if (formValues.cost_details) {
      // Ensure all needed fields are present with proper type conversion
      const updatedCostDetails = {
        adult_price: Number(formValues.cost_details.adult_price || 0),
        child_price: Number(formValues.cost_details.child_price || 0),
        infant_price: Number(formValues.cost_details.infant_price || 0),
        total_cost: Number(formValues.cost_details.total_cost || 0),
        total_sell: Number(formValues.cost_details.total_sell || 0),
        total_profit: Number(formValues.cost_details.total_profit || 0),
        ...formValues.cost_details
      };
      
      // Check if we have necessary data to recalculate costs
      const hasPassengers = formValues.passengers && 
        (Number(formValues.passengers.adult || 0) > 0 || 
         Number(formValues.passengers.child || 0) > 0 || 
         Number(formValues.passengers.infant || 0) > 0);
      
      const hasPrices = updatedCostDetails.adult_price > 0 || 
                        updatedCostDetails.child_price > 0 || 
                        updatedCostDetails.infant_price > 0;
      
      // If we have both passengers and prices but no total_cost, calculate it
      if (hasPassengers && hasPrices && !updatedCostDetails.total_cost) {
        const adultCount = Number(formValues.passengers.adult || 0);
        const childCount = Number(formValues.passengers.child || 0);
        const infantCount = Number(formValues.passengers.infant || 0);
        
        updatedCostDetails.total_cost = 
          (adultCount * updatedCostDetails.adult_price) + 
          (childCount * updatedCostDetails.child_price) + 
          (infantCount * updatedCostDetails.infant_price);
        
        // If no total_sell, set it equal to total_cost
        if (!updatedCostDetails.total_sell) {
          updatedCostDetails.total_sell = updatedCostDetails.total_cost;
        }
        
        // Recalculate profit
        updatedCostDetails.total_profit = updatedCostDetails.total_sell - updatedCostDetails.total_cost;
      }
      
      setCostDetails(updatedCostDetails);
    }
  }, [formValues.passenger_details, formValues.cost_details, formValues.passengers]);

  // Ticket status options
  const ticketStatusOptions = [
    { value: 'inquiry', label: 'Inquiry' },
    { value: 'booking', label: 'Booking' },
    { value: 'issued', label: 'Issued' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refund', label: 'Refund' }
  ];

  // Handle passenger count changes
  const handlePassengerCountChange = (type, value) => {
    // Create an updated passengers object with the new count
    const updatedPassengers = { 
      ...formValues.passengers,
      [type]: value 
    };
    
    // Calculate updated total cost based on new passenger counts
    const adultCount = Number(type === 'adult' ? value : updatedPassengers.adult || 0);
    const childCount = Number(type === 'child' ? value : updatedPassengers.child || 0);
    const infantCount = Number(type === 'infant' ? value : updatedPassengers.infant || 0);
    
    // Calculate total cost based on current prices
    const totalCost = 
      (adultCount * Number(costDetails.adult_price || 0)) +
      (childCount * Number(costDetails.child_price || 0)) +
      (infantCount * Number(costDetails.infant_price || 0));
    
    // Update cost details
    const updatedCostDetails = { 
      ...costDetails,
      total_cost: totalCost 
    };
    
    // If total_sell is defined, update profit, otherwise set total_sell to totalCost
    if (updatedCostDetails.total_sell !== undefined) {
      updatedCostDetails.total_profit = Number(updatedCostDetails.total_sell) - totalCost;
    } else {
      updatedCostDetails.total_sell = totalCost;
      updatedCostDetails.total_profit = 0;
    }
    
    // Update state and form
    form.setFieldsValue({ 
      passengers: updatedPassengers,
      cost_details: updatedCostDetails
    });
    
    // Update parent component state
    handleInputChange('passengers', updatedPassengers);
    handleInputChange('cost_details', updatedCostDetails);
    setCostDetails(updatedCostDetails);
  };

  // Add a new passenger
  const addPassenger = () => {
    const newPassengers = [...passengers, { 
      passenger_fname: '', 
      passenger_lname: '', 
      passport_no: '', 
      expiry_date: null 
    }];
    setPassengers(newPassengers);
    handleInputChange('passenger_details', newPassengers);
  };

  // Remove a passenger
  const removePassenger = (index) => {
    const newPassengers = [...passengers];
    newPassengers.splice(index, 1);
    setPassengers(newPassengers);
    handleInputChange('passenger_details', newPassengers);
  };

  // Update passenger details
  const updatePassenger = (index, field, value) => {
    const newPassengers = [...passengers];
    
    // Handle date fields specially
    if (field === 'expiry_date') {
      // If value is a dayjs object, store it as is
      // Otherwise keep it as null
      newPassengers[index][field] = value;
    } else {
      newPassengers[index][field] = value;
    }
    
    setPassengers(newPassengers);
    handleInputChange('passenger_details', newPassengers);
  };

  // Update cost details
  const updateCostDetail = (field, value) => {
    // Create a copy of the current cost details and update the specific field
    const updated = { ...costDetails, [field]: value };
    
    // If updating one of the price fields, recalculate total_cost
    if (field === 'adult_price' || field === 'child_price' || field === 'infant_price') {
      // Get passenger counts
      const adultCount = Number(formValues.passengers?.adult || 0);
      const childCount = Number(formValues.passengers?.child || 0);
      const infantCount = Number(formValues.passengers?.infant || 0);
      
      // Calculate new total cost based on updated prices
      const totalCost = 
        (adultCount * Number(field === 'adult_price' ? value : updated.adult_price || 0)) +
        (childCount * Number(field === 'child_price' ? value : updated.child_price || 0)) +
        (infantCount * Number(field === 'infant_price' ? value : updated.infant_price || 0));
      
      updated.total_cost = totalCost;
      
      // Only update total_profit if total_sell is defined
      if (updated.total_sell !== undefined) {
        updated.total_profit = Number(updated.total_sell) - totalCost;
      } else {
        // If total_sell isn't defined, set it equal to the new total_cost with profit = 0
        updated.total_sell = totalCost;
        updated.total_profit = 0;
      }
    }
    
    // If updating total_sell, recalculate total_profit
    if (field === 'total_sell') {
      const totalCost = updated.total_cost !== undefined ? Number(updated.total_cost) : calculateTotalCost();
      updated.total_profit = Number(value) - totalCost;
    }
    
    // Update the state and form values
    setCostDetails(updated);
    form.setFieldsValue({ cost_details: updated });
    
    // Update parent component state
    handleInputChange('cost_details', updated);
  };

  // Calculate total cost based on passenger counts and prices
  const calculateTotalCost = () => {
    const adultCount = Number(formValues.passengers?.adult || 0);
    const childCount = Number(formValues.passengers?.child || 0);
    const infantCount = Number(formValues.passengers?.infant || 0);
    
    const adultPrice = Number(costDetails.adult_price || 0);
    const childPrice = Number(costDetails.child_price || 0);
    const infantPrice = Number(costDetails.infant_price || 0);
    
    const totalCost = (adultCount * adultPrice) + (childCount * childPrice) + (infantCount * infantPrice);
    return totalCost;
  };

  // Calculate total profit
  const calculateTotalProfit = () => {
    // Use the stored total_cost and total_sell if available, otherwise calculate them
    const totalCost = costDetails.total_cost !== undefined ? Number(costDetails.total_cost) : calculateTotalCost();
    const totalSell = costDetails.total_sell !== undefined ? Number(costDetails.total_sell) : totalCost;
    
    const profit = totalSell - totalCost;
    return profit;
  };

  return (
    <Grid container spacing={3}>
      {/* Flight Details */}
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#9d277c', fontWeight: 'bold' }}>
            Flight Details
          </Typography>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Travelling From" 
                name="travelling_from"
                rules={[{ required: true, message: 'Please enter departure city' }]}
              >
                <Input 
                  placeholder="Enter departure city"
                  value={formValues.travelling_from}
                  onChange={(e) => handleInputChange('travelling_from', e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Travelling To" 
                name="travelling_to"
                rules={[{ required: true, message: 'Please enter arrival city' }]}
              >
                <Input 
                  placeholder="Enter arrival city"
                  value={formValues.travelling_to}
                  onChange={(e) => handleInputChange('travelling_to', e.target.value)}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Travel Date" 
                name="travel_date"
                rules={[{ required: true, message: 'Please select travel date' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  value={formValues.travel_date ? (dayjs(formValues.travel_date).isValid() ? dayjs(formValues.travel_date) : null) : null}
                  onChange={(date) => handleInputChange('travel_date', date)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Return Date" 
                name="return_date"
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  value={formValues.return_date ? (dayjs(formValues.return_date).isValid() ? dayjs(formValues.return_date) : null) : null}
                  onChange={(date) => handleInputChange('return_date', date)}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="PNR" 
                name="pnr"
              >
                <Input 
                  placeholder="Enter PNR (optional)"
                  value={formValues.pnr}
                  onChange={(e) => handleInputChange('pnr', e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Carrier" 
                name="carrier"
                rules={[{ required: true, message: 'Please enter carrier' }]}
              >
                <Input 
                  placeholder="Enter carrier"
                  value={formValues.carrier}
                  onChange={(e) => handleInputChange('carrier', e.target.value)}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item 
            label="Ticket Status" 
            name="ticket_status"
            rules={[{ required: true, message: 'Please select ticket status' }]}
          >
            <Select
              placeholder="Select ticket status"
              value={formValues.ticket_status}
              onChange={(value) => handleInputChange('ticket_status', value)}
            >
              {ticketStatusOptions.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Paper>
      </Grid>
      
      {/* Passenger Count */}
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#9d277c', fontWeight: 'bold' }}>
            Passenger Count
          </Typography>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item 
                label="Adults" 
                name={['passengers', 'adult']}
                rules={[{ type: 'number', min: 0 }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  value={formValues.passengers?.adult || 0}
                  onChange={(value) => handlePassengerCountChange('adult', value)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                label="Children" 
                name={['passengers', 'child']}
                rules={[{ type: 'number', min: 0 }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  value={formValues.passengers?.child || 0}
                  onChange={(value) => handlePassengerCountChange('child', value)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                label="Infants" 
                name={['passengers', 'infant']}
                rules={[{ type: 'number', min: 0 }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  value={formValues.passengers?.infant || 0}
                  onChange={(value) => handlePassengerCountChange('infant', value)}
                />
              </Form.Item>
            </Col>
          </Row>
        </Paper>
      </Grid>
      
      {/* Passenger Details */}
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#9d277c', fontWeight: 'bold' }}>
              Passenger Details
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<PlusOutlined />}
              onClick={addPassenger}
              sx={{ bgcolor: '#9d277c', '&:hover': { bgcolor: '#7c1e62' } }}
            >
              Add Passenger
            </Button>
          </Box>
          
          {passengers.length > 0 ? (
            passengers.map((passenger, index) => (
              <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Passenger {index + 1}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => removePassenger(index)}
                    sx={{ color: 'error.main' }}
                  >
                    <MinusCircleOutlined />
                  </IconButton>
                </Box>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      label="First Name" 
                      name={['passenger_details', index, 'passenger_fname']}
                      rules={[{ required: true, message: 'Please enter first name' }]}
                    >
                      <Input 
                        placeholder="Enter first name"
                        value={passenger.passenger_fname}
                        onChange={(e) => updatePassenger(index, 'passenger_fname', e.target.value)}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      label="Last Name" 
                      name={['passenger_details', index, 'passenger_lname']}
                      rules={[{ required: true, message: 'Please enter last name' }]}
                    >
                      <Input 
                        placeholder="Enter last name"
                        value={passenger.passenger_lname}
                        onChange={(e) => updatePassenger(index, 'passenger_lname', e.target.value)}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      label="Passport Number" 
                      name={['passenger_details', index, 'passport_no']}
                      rules={[{ required: true, message: 'Please enter passport number' }]}
                    >
                      <Input 
                        placeholder="Enter passport number"
                        value={passenger.passport_no}
                        onChange={(e) => updatePassenger(index, 'passport_no', e.target.value)}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      label="Expiry Date" 
                      name={['passenger_details', index, 'expiry_date']}
                      rules={[{ required: true, message: 'Please select expiry date' }]}
                    >
                      <DatePicker 
                        style={{ width: '100%' }}
                        value={passenger.expiry_date ? (dayjs(passenger.expiry_date).isValid() ? dayjs(passenger.expiry_date) : null) : null}
                        onChange={(date) => updatePassenger(index, 'expiry_date', date)}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Box>
            ))
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No passengers added yet. Click "Add Passenger" to add passenger details.
            </Typography>
          )}
        </Paper>
      </Grid>
      
      {/* Cost Details */}
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#9d277c', fontWeight: 'bold' }}>
            Cost Details
          </Typography>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item 
                label="Adult Price" 
                name={['cost_details', 'adult_price']}
                rules={[{ type: 'number', min: 0 }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  value={costDetails.adult_price}
                  onChange={(value) => updateCostDetail('adult_price', value)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                label="Child Price" 
                name={['cost_details', 'child_price']}
                rules={[{ type: 'number', min: 0 }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  value={costDetails.child_price}
                  onChange={(value) => updateCostDetail('child_price', value)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                label="Infant Price" 
                name={['cost_details', 'infant_price']}
                rules={[{ type: 'number', min: 0 }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  value={costDetails.infant_price}
                  onChange={(value) => updateCostDetail('infant_price', value)}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider />
          
          <Row gutter={16}>
            <Col span={8}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Total Cost: {(costDetails.total_cost !== undefined ? Number(costDetails.total_cost) : calculateTotalCost()).toLocaleString()}
              </Typography>
            </Col>
            <Col span={8}>
              <Form.Item 
                label="Total Sell" 
                name={['cost_details', 'total_sell']}
                rules={[{ type: 'number', min: 0 }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  value={costDetails.total_sell !== undefined ? Number(costDetails.total_sell) : calculateTotalCost()}
                  onChange={(value) => updateCostDetail('total_sell', value)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: calculateTotalProfit() >= 0 ? 'success.main' : 'error.main' }}>
                Total Profit: {(costDetails.total_profit !== undefined ? Number(costDetails.total_profit) : calculateTotalProfit()).toLocaleString()}
              </Typography>
            </Col>
          </Row>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default FlightForm; 