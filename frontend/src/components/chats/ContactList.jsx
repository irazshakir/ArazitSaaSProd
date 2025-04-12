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
  CircularProgress,
  Avatar,
  Chip,
  Tooltip,
  Alert
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const ContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noApiConfigured, setNoApiConfigured] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setNoApiConfigured(false);
      
      // Get tenant ID from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/contacts/', {
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
          throw new Error(errorData.error || errorData.errMsg || 'Failed to load contacts');
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
        throw new Error(data.errMsg || 'Failed to load contacts');
      }
      
      setContacts(data.contacts || []);
    } catch (error) {
      setError('Error fetching contacts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
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
          WhatsApp Contacts
        </Typography>
        <Alert severity="warning">
          No WhatsApp API configured for this tenant. Please configure your WhatsApp API settings to start using contacts.
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography variant="h6" gutterBottom>
          WhatsApp Contacts
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h6" mb={3}>
        WhatsApp Contacts
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Contact</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Last Message</TableCell>
              <TableCell>Last Reply</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {contact.avatar ? (
                        <img src={contact.avatar} alt={contact.name} />
                      ) : (
                        <PersonIcon />
                      )}
                    </Avatar>
                    <Typography>{contact.name || 'Unknown'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {contact.last_message}
                    {contact.is_last_message_by_contact === 1 && (
                      <Tooltip title="Last message by contact">
                        <ChatIcon sx={{ ml: 1, color: 'primary.main' }} />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{formatDate(contact.last_reply_at)}</TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    {contact.has_chat === 1 && (
                      <Tooltip title="Has active chat">
                        <ChatIcon color="primary" />
                      </Tooltip>
                    )}
                    {contact.resolved_chat === 1 && (
                      <Tooltip title="Chat resolved">
                        <CheckCircleIcon color="success" />
                      </Tooltip>
                    )}
                    {contact.enabled_ai_bot === 1 && (
                      <Tooltip title="AI Bot enabled">
                        <SmartToyIcon color="secondary" />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ContactList; 