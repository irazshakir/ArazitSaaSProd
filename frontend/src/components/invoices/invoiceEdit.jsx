import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Autocomplete,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ArrowBack, Delete, Add, Receipt, Print } from '@mui/icons-material';
import { message } from 'antd';
import api from '../../services/api';
import dayjs from 'dayjs';

const InvoiceEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchingInvoice, setFetchingInvoice] = useState(true);
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_date: dayjs().format('YYYY-MM-DD'),
    payment_method: 'Cash',
    transaction_id: '',
    notes: ''
  });
  
  // Invoice form state
  const [formData, setFormData] = useState({
    invoice_number: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    lead: null,
    issue_date: '',
    due_date: '',
    total_amount: 0,
    paid_amount: 0,
    status: 'NO_PAYMENT',
    notes: '',
  });

  // Fetch invoice data
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setFetchingInvoice(true);
        const response = await api.get(`invoices/${id}/`);
        
        // Format dates to YYYY-MM-DD for the form
        const invoiceData = {
          ...response.data,
          issue_date: response.data.issue_date ? dayjs(response.data.issue_date).format('YYYY-MM-DD') : '',
          due_date: response.data.due_date ? dayjs(response.data.due_date).format('YYYY-MM-DD') : '',
        };
        
        setFormData(invoiceData);
        setFetchingInvoice(false);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        message.error('Failed to load invoice data. Please try again.');
        setFetchingInvoice(false);
        navigate('/dashboard/invoices');
      }
    };
    
    fetchInvoice();
  }, [id, navigate]);

  // Fetch payments for this invoice
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoadingPayments(true);
        const response = await api.get(`invoices/${id}/payments/`);
        
        setPayments(response.data);
        setLoadingPayments(false);
      } catch (error) {
        console.error('Error fetching payments:', error);
        setLoadingPayments(false);
      }
    };
    
    if (id) {
      fetchPayments();
    }
  }, [id]);

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
      lead: newValue ? newValue.id : null
    });
  };

  // Handle date changes
  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date ? dayjs(date).format('YYYY-MM-DD') : null
    });
  };

  // Handle payment form field changes
  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({
      ...paymentData,
      [name]: value
    });
  };

  // Handle payment date change
  const handlePaymentDateChange = (date) => {
    setPaymentData({
      ...paymentData,
      payment_date: date ? dayjs(date).format('YYYY-MM-DD') : null
    });
  };

  // Handle add payment
  const handleAddPayment = async () => {
    try {
      if (!paymentData.amount || !paymentData.payment_date || !paymentData.payment_method) {
        message.error('Please fill in all required payment fields');
        return;
      }
      
      const paymentToAdd = {
        ...paymentData,
        invoice: id,
        amount: parseFloat(paymentData.amount)
      };
      
      // Submit to API
      await api.post('payments/', paymentToAdd);
      
      message.success('Payment added successfully!');
      
      // Reset payment form
      setPaymentData({
        amount: '',
        payment_date: dayjs().format('YYYY-MM-DD'),
        payment_method: 'Cash',
        transaction_id: '',
        notes: ''
      });
      
      // Refresh payments and invoice data
      const [paymentResponse, invoiceResponse] = await Promise.all([
        api.get(`invoices/${id}/payments/`),
        api.get(`invoices/${id}/`)
      ]);
      
      setPayments(paymentResponse.data);
      
      // Update paid_amount and status in form
      setFormData(prev => ({
        ...prev,
        paid_amount: invoiceResponse.data.paid_amount,
        status: invoiceResponse.data.status
      }));
      
    } catch (error) {
      console.error('Error adding payment:', error);
      message.error('Failed to add payment. Please try again.');
    }
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
      
      // Don't send read-only fields back to the API
      delete invoiceData.paid_amount;
      delete invoiceData.status;
      delete invoiceData.created_at;
      delete invoiceData.updated_at;
      delete invoiceData.payments;
      delete invoiceData.created_by;
      delete invoiceData.created_by_name;
      
      // Submit to API
      await api.put(`invoices/${id}/`, invoiceData);
      
      setLoading(false);
      message.success('Invoice updated successfully!');
      navigate('/dashboard/invoices');
    } catch (error) {
      console.error('Error updating invoice:', error);
      console.error('Error details:', error.response?.data);
      message.error('Failed to update invoice. Please try again.');
      setLoading(false);
    }
  };

  // Get selected lead object based on ID
  const getSelectedLead = () => {
    if (!formData.lead) return null;
    return leads.find(lead => lead.id === formData.lead) || null;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return dateString ? dayjs(dateString).format('MMM D, YYYY') : 'N/A';
  };

  if (fetchingInvoice) {
    return (
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        <Typography>Loading invoice data...</Typography>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ pt: 2, pb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/dashboard/invoices')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Edit Invoice #{formData.invoice_number}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => navigate(`/dashboard/invoices/${id}/print`)}
            sx={{ ml: 2 }}
          >
            Print Invoice
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {/* Invoice Edit Form */}
          <Grid item xs={12} md={8}>
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
                      value={getSelectedLead()}
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
                      value={formData.customer_email || ''}
                      onChange={handleChange}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Customer Phone"
                      name="customer_phone"
                      value={formData.customer_phone || ''}
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
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      disabled
                      label="Paid Amount"
                      name="paid_amount"
                      type="number"
                      value={formData.paid_amount}
                      inputProps={{ min: 0, step: 0.01 }}
                      helperText="Updated automatically from payments"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      name="notes"
                      value={formData.notes || ''}
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
                        {loading ? 'Updating...' : 'Update Invoice'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>
          
          {/* Sidebar with Payment Info and Add Payment */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Status Card */}
              <Card elevation={0} sx={{ borderRadius: 2 }}>
                <CardHeader 
                  title="Invoice Status"
                  avatar={<Receipt color="primary" />}
                />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Typography variant="h6" sx={{ 
                      color: formData.status === 'PAID' ? 'success.main' : 
                             formData.status === 'PARTIALLY_PAID' ? 'warning.main' : 
                             'error.main' 
                    }}>
                      {formData.status === 'PAID' ? 'Paid' : 
                       formData.status === 'PARTIALLY_PAID' ? 'Partially Paid' : 
                       'No Payment Yet'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                    <Typography variant="h6">{formatCurrency(formData.total_amount)}</Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Paid Amount</Typography>
                    <Typography variant="h6">{formatCurrency(formData.paid_amount)}</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">Balance Due</Typography>
                    <Typography variant="h6">
                      {formatCurrency(formData.total_amount - formData.paid_amount)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
              
              {/* Add Payment */}
              <Card elevation={0} sx={{ borderRadius: 2 }}>
                <CardHeader title="Add Payment" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        label="Amount"
                        name="amount"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                        value={paymentData.amount}
                        onChange={handlePaymentChange}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <DatePicker
                        label="Payment Date"
                        value={paymentData.payment_date ? new Date(paymentData.payment_date) : null}
                        onChange={handlePaymentDateChange}
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
                      <FormControl fullWidth required>
                        <InputLabel>Payment Method</InputLabel>
                        <Select
                          name="payment_method"
                          value={paymentData.payment_method}
                          onChange={handlePaymentChange}
                          label="Payment Method"
                        >
                          <MenuItem value="Cash">Cash</MenuItem>
                          <MenuItem value="Credit Card">Credit Card</MenuItem>
                          <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                          <MenuItem value="Check">Check</MenuItem>
                          <MenuItem value="PayPal">PayPal</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Transaction ID"
                        name="transaction_id"
                        value={paymentData.transaction_id}
                        onChange={handlePaymentChange}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        name="notes"
                        value={paymentData.notes}
                        onChange={handlePaymentChange}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        onClick={handleAddPayment}
                        startIcon={<Add />}
                      >
                        Add Payment
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              {/* Payment History */}
              <Card elevation={0} sx={{ borderRadius: 2 }}>
                <CardHeader 
                  title="Payment History" 
                  subheader={`${payments.length} payments`}
                />
                <CardContent sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  {loadingPayments ? (
                    <Typography>Loading payments...</Typography>
                  ) : payments.length === 0 ? (
                    <Typography color="text.secondary">No payments recorded yet</Typography>
                  ) : (
                    <List disablePadding>
                      {payments.map((payment) => (
                        <ListItem 
                          key={payment.id}
                          divider
                          sx={{ px: 0 }}
                        >
                          <ListItemText
                            primary={formatCurrency(payment.amount)}
                            secondary={`${formatDate(payment.payment_date)} · ${payment.payment_method}${payment.transaction_id ? ` · #${payment.transaction_id}` : ''}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
};

export default InvoiceEdit; 