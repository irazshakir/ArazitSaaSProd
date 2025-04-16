import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Snackbar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PreviewIcon from '@mui/icons-material/Preview';

const TemplateList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sending, setSending] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [noApiConfigured, setNoApiConfigured] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setNoApiConfigured(false);
      
      // Get tenant ID from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/templates/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        // Check if the response is HTML (likely a server error page)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        // Try to parse as JSON
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.includes('No WhatsApp API settings configured')) {
            setNoApiConfigured(true);
            setError('No WhatsApp API configured for this tenant');
            return;
          }
          throw new Error(errorData.error || errorData.errMsg || 'Failed to load templates');
        } catch (jsonError) {
          // If JSON parsing fails, use the status text
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      
      if (!data.status || data.status === 'error') {
        // Check if the error is due to no API configuration
        if (data.error && data.error.includes('No WhatsApp API settings configured')) {
          setNoApiConfigured(true);
          setError('No WhatsApp API configured for this tenant');
          return;
        }
        throw new Error(data.errMsg || 'Failed to load templates');
      }
      
      setTemplates(data.templates || []);
    } catch (error) {
      setError('Error fetching templates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (template) => {
    // TODO: Implement template preview functionality
  };

  const handleSend = (template) => {
    setSelectedTemplate(template);
    setSendDialogOpen(true);
  };

  const handleSendConfirm = async () => {
    if (!phoneNumber || !selectedTemplate) return;

    setSending(true);
    try {
      // Get tenant ID from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      // Format phone number to remove any spaces and ensure it starts with '+'
      const formattedPhone = phoneNumber.trim().replace(/^\+?/, '+');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/templates/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          phone: formattedPhone,
          template_name: selectedTemplate.name,
          template_language: selectedTemplate.language || 'en', // default to English if not specified
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: formattedPhone // You can customize this based on template requirements
                }
              ]
            }
          ]
        }),
      });

      const data = await response.json();
      
      if (!data.status || data.status === 'error') {
        // Check if the error is due to no API configuration
        if (data.error && data.error.includes('No WhatsApp API settings configured')) {
          setNoApiConfigured(true);
          setError('No WhatsApp API configured for this tenant');
          return;
        }
        throw new Error(data.errMsg || 'Failed to send template message');
      }
      
      setSnackbar({
        open: true,
        message: 'Template message sent successfully!',
        severity: 'success'
      });
      setSendDialogOpen(false);
      setPhoneNumber(''); // Clear the phone number after successful send
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    } finally {
      setSending(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (noApiConfigured) {
    return (
      <Box p={3}>
        <Typography variant="h6" gutterBottom>
          WhatsApp Templates
        </Typography>
        <Alert severity="warning">
          No WhatsApp API configured for this tenant. Please configure your WhatsApp API settings to start using templates.
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography variant="h6" gutterBottom>
          WhatsApp Templates
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        WhatsApp Templates
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Language</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>{template.name}</TableCell>
                <TableCell>{template.category}</TableCell>
                <TableCell>{template.language}</TableCell>
                <TableCell>
                  <Chip
                    label={template.status}
                    color={template.status === 'APPROVED' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Preview Template">
                    <IconButton onClick={() => handlePreview(template)}>
                      <PreviewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Send Template">
                    <IconButton onClick={() => handleSend(template)}>
                      <SendIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Send Template Dialog */}
      <Dialog 
        open={sendDialogOpen} 
        onClose={() => setSendDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Send Template Message
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <TextField
              fullWidth
              label="Recipient Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., +1234567890"
              helperText="Include country code (e.g., +1 for US)"
              disabled={sending}
            />
          </Box>
          {selectedTemplate && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Template Details:
              </Typography>
              <Typography variant="body2">
                Name: {selectedTemplate.name}<br />
                Language: {selectedTemplate.language}<br />
                Category: {selectedTemplate.category}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setSendDialogOpen(false)} 
            disabled={sending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendConfirm} 
            variant="contained" 
            color="primary"
            disabled={!phoneNumber || sending}
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TemplateList; 