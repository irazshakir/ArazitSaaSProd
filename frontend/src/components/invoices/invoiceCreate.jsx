import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ArrowBack, Delete, Add } from '@mui/icons-material';
import { message } from 'antd';
import api from '../../services/api';
import dayjs from 'dayjs';

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  
  // Invoice form state
  const [formData, setFormData] = useState({
    invoice_number: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    lead: null,
    issue_date: dayjs().format('YYYY-MM-DD'),
    due_date: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    total_amount: 0,
    notes: '',
  });

  // Fetch leads for dropdown
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoadingLeads(true);
        const response = await api.get('leads/');
        
        // Process response data
        let leadsArray = Array.isArray(response.data) 
          ? response.data
          : (response.data?.results && Array.isArray(response.data.results))
            ? response.data.results 
            : [];
        
        // Format the leads data
        const formattedLeads = leadsArray.map(lead => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone
        }));
        
        setLeads(formattedLeads);
        setLoadingLeads(false);
      } catch (error) {
        console.error('Error fetching leads:', error);
        message.error('Failed to load leads data.');
        setLoadingLeads(false);
      }
    };
    
    fetchLeads();
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle lead selection
  const handleLeadChange = (event, newValue) => {
    setFormData({
      ...formData,
      lead: newValue ? newValue.id : null,
      customer_name: newValue ? newValue.name : formData.customer_name,
      customer_email: newValue ? newValue.email : formData.customer_email,
      customer_phone: newValue ? newValue.phone : formData.customer_phone
    });
  };

  // Handle date changes
  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date ? dayjs(date).format('YYYY-MM-DD') : null
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate required fields
      if (!formData.invoice_number || !formData.customer_name || !formData.issue_date || !formData.due_date) {
        message.error('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Prepare data for API
      const invoiceData = {
        ...formData,
        total_amount: parseFloat(formData.total_amount)
      };
      
      // Submit to API
      const response = await api.post('invoices/', invoiceData);
      
      setLoading(false);
      message.success('Invoice created successfully!');
      navigate('/dashboard/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
      console.error('Error details:', error.response?.data);
      message.error('Failed to create invoice. Please try again.');
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return parseFloat(value).toFixed(2);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ pt: 2, pb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/dashboard/invoices')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Create New Invoice
          </Typography>
        </Box>
        
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Invoice Details Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Invoice Details
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Invoice Number"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={leads}
                  getOptionLabel={(option) => option.name || ''}
                  onChange={handleLeadChange}
                  loading={loadingLeads}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Lead (Optional)"
                      variant="outlined"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Customer Name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Customer Email"
                  name="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Customer Phone"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Issue Date"
                  value={formData.issue_date ? new Date(formData.issue_date) : null}
                  onChange={(date) => handleDateChange('issue_date', date)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  inputFormat="MM/dd/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      variant: 'outlined'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Due Date"
                  value={formData.due_date ? new Date(formData.due_date) : null}
                  onChange={(date) => handleDateChange('due_date', date)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  inputFormat="MM/dd/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      variant: 'outlined'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              
              {/* Amount Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Amount Details
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Total Amount"
                  name="total_amount"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={formData.total_amount}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={4}
                />
              </Grid>
              
              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/dashboard/invoices')}
                    sx={{ mr: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Invoice'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default InvoiceCreate; 