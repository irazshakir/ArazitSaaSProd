import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Chip
} from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PrintOutlined, CloudDownloadOutlined, ArrowBackOutlined } from '@mui/icons-material';
import api from '../../services/api';
import dataAccessService from '../../services/dataAccessService';

const InvoicePrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  const [invoice, setInvoice] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(true);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching invoice with ID: ${id}`);
        
        // Fetch invoice data - try with and without /api prefix
        try {
          console.log(`Attempting to fetch invoice from: invoices/${id}/`);
          const response = await api.get(`invoices/${id}/`);
          console.log('Invoice data received:', response.data);
          setInvoice(response.data);
        } catch (invoiceErr) {
          console.log(`Error fetching invoice: ${invoiceErr.message}`);
          console.log('Trying alternate URL format...');
          try {
            console.log(`Attempting to fetch invoice from: api/invoices/${id}/`);
            const response = await api.get(`api/invoices/${id}/`);
            console.log('Invoice data received from alternate URL:', response.data);
            setInvoice(response.data);
          } catch (altInvoiceErr) {
            console.error(`Error with both invoice URL formats: ${altInvoiceErr.message}`);
            throw new Error('Could not fetch invoice data');
          }
        }
        
        // Get tenant_id from local storage
        let tenant_id;
        try {
          tenant_id = dataAccessService.getTenantId();
          console.log(`Using tenant_id from dataAccessService: ${tenant_id}`);
        } catch (err) {
          console.log('Error getting tenant_id from dataAccessService, fallback to localStorage');
          tenant_id = localStorage.getItem('tenant_id');
          console.log(`Using tenant_id from localStorage: ${tenant_id}`);
        }
        
        if (!tenant_id) {
          console.warn('No tenant_id found, attempting to extract from user data');
          try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            tenant_id = userData.tenant_id;
            console.log(`Using tenant_id from userData: ${tenant_id}`);
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
        
        console.log(`Final tenant_id to use: ${tenant_id}`);
        
        // Fetch company details based on tenant_id - try with and without /api prefix
        if (tenant_id) {
          try {
            console.log(`Attempting to fetch company details from: company-settings/${tenant_id}/`);
            const companyResponse = await api.get(`company-settings/${tenant_id}/`);
            console.log('Company details received:', companyResponse.data);
            setCompanyDetails(companyResponse.data);
          } catch (companyErr) {
            console.log(`Error fetching company details: ${companyErr.message}`);
            try {
              console.log(`Attempting to fetch company details from: api/company-settings/${tenant_id}/`);
              const companyResponse = await api.get(`api/company-settings/${tenant_id}/`);
              console.log('Company details received from alternate URL:', companyResponse.data);
              setCompanyDetails(companyResponse.data);
            } catch (altCompanyErr) {
              console.error(`Error with both company details URL formats: ${altCompanyErr.message}`);
              // Continue even if company details can't be fetched
              console.warn('Continuing without company details');
            }
          }
        } else {
          console.warn('Cannot fetch company details: no tenant_id available');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching invoice data:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        setError(`Failed to load invoice data: ${err.message}`);
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id]);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!invoice) return;
      
      try {
        setLoadingPaymentHistory(true);
        
        // Try with and without /api prefix
        try {
          console.log(`Attempting to fetch payment history from: invoices/${id}/payments/`);
          const response = await api.get(`invoices/${id}/payments/`);
          console.log('Payment history received:', response.data);
          setPaymentHistory(response.data);
        } catch (paymentErr) {
          console.log(`Error fetching payment history: ${paymentErr.message}`);
          try {
            console.log(`Attempting to fetch payment history from: api/invoices/${id}/payments/`);
            const response = await api.get(`api/invoices/${id}/payments/`);
            console.log('Payment history received from alternate URL:', response.data);
            setPaymentHistory(response.data);
          } catch (altPaymentErr) {
            console.error(`Error with both payment history URL formats: ${altPaymentErr.message}`);
            // Continue without payment history
            console.warn('Continuing without payment history');
          }
        }
        
        setLoadingPaymentHistory(false);
      } catch (err) {
        console.error('Error fetching payment history:', err);
        setLoadingPaymentHistory(false);
      }
    };

    fetchPaymentHistory();
  }, [invoice, id]);

  const formatCurrency = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIALLY_PAID':
        return 'warning';
      case 'OVERDUE':
        return 'error';
      case 'PENDING':
        return 'info';
      default:
        return 'default';
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Invoice-${invoice?.invoice_number || 'Unknown'}`
  });

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`Invoice-${invoice?.invoice_number || 'Unknown'}.pdf`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Container sx={{ py: 5, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading invoice...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 5, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Typography variant="body2" sx={{ mt: 1, mb: 3 }}>
          Please check console for more details.
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackOutlined />} 
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  if (!invoice) {
    return (
      <Container sx={{ py: 5, textAlign: 'center' }}>
        <Typography>No invoice data available</Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackOutlined />} 
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  // Create a fallback company details object if none was fetched
  const company = companyDetails || {
    company_name: 'Your Company Name',
    address: 'Company Address',
    phone: 'Company Phone',
    email: 'company@example.com'
  };

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackOutlined />} 
          onClick={handleBack}
        >
          Back
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<PrintOutlined />} 
          onClick={handlePrint}
        >
          Print Invoice
        </Button>
        <Button 
          variant="contained" 
          color="secondary" 
          startIcon={<CloudDownloadOutlined />} 
          onClick={handleDownloadPDF}
        >
          Download PDF
        </Button>
      </Stack>

      <Paper 
        elevation={3} 
        ref={printRef} 
        sx={{ 
          p: 4, 
          width: '100%', 
          minHeight: '297mm',
          maxHeight: 'auto',
          backgroundColor: '#fff',
          color: '#000'
        }}
      >
        {/* Invoice Header */}
        <Grid container spacing={3}>
          <Grid item xs={6}>
            {company.logo ? (
              <Box 
                component="img" 
                sx={{ 
                  maxHeight: 80,
                  maxWidth: 200,
                  mb: 2
                }}
                src={company.logo}
                alt="Company Logo"
              />
            ) : (
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
                {company.company_name}
              </Typography>
            )}
            <Typography variant="body1">{company.address}</Typography>
            <Typography variant="body1">{company.phone}</Typography>
            <Typography variant="body1">{company.email}</Typography>
            {company.website && (
              <Typography variant="body1">{company.website}</Typography>
            )}
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
              INVOICE
            </Typography>
            <Typography variant="body1">
              <strong>Invoice Number:</strong> {invoice.invoice_number}
            </Typography>
            <Typography variant="body1">
              <strong>Issue Date:</strong> {formatDate(invoice.issue_date)}
            </Typography>
            <Typography variant="body1">
              <strong>Due Date:</strong> {formatDate(invoice.due_date)}
            </Typography>
            <Chip 
              label={invoice.status} 
              color={getStatusColor(invoice.status)} 
              sx={{ mt: 1 }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Customer Information */}
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Bill To:
            </Typography>
            <Typography variant="body1">
              <strong>Customer:</strong> {invoice.customer_name || 'N/A'}
            </Typography>
            <Typography variant="body1">
              <strong>Email:</strong> {invoice.customer_email || 'N/A'}
            </Typography>
            <Typography variant="body1">
              <strong>Phone:</strong> {invoice.customer_phone || 'N/A'}
            </Typography>
            {invoice.lead && (
              <Typography variant="body1">
                <strong>Lead:</strong> {invoice.lead?.name || 'N/A'}
              </Typography>
            )}
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Payment Details:
            </Typography>
            <Typography variant="body1">
              <strong>Amount Due:</strong> {formatCurrency(invoice.total_amount - invoice.paid_amount)}
            </Typography>
            <Typography variant="body1">
              <strong>Payment Status:</strong> {invoice.status}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Invoice Items */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Invoice Details
        </Typography>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell align="right"><strong>Amount</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{invoice.description || 'Service Fee'}</TableCell>
                <TableCell align="right">{formatCurrency(invoice.total_amount)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell align="right"><strong>Total</strong></TableCell>
                <TableCell align="right"><strong>{formatCurrency(invoice.total_amount)}</strong></TableCell>
              </TableRow>
              <TableRow>
                <TableCell align="right"><strong>Paid Amount</strong></TableCell>
                <TableCell align="right">{formatCurrency(invoice.paid_amount)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell align="right"><strong>Balance Due</strong></TableCell>
                <TableCell align="right"><strong>{formatCurrency(invoice.total_amount - invoice.paid_amount)}</strong></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <>
            <Divider sx={{ my: 4 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Payment History
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Method</strong></TableCell>
                    <TableCell align="right"><strong>Amount</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        <Divider sx={{ my: 4 }} />

        {/* Notes and Terms */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Notes:</strong> {invoice.notes || 'No additional notes'}
            </Typography>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Thank you for your business!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {company.company_name} - {company.phone} - {company.email}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default InvoicePrint; 