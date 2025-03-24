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
  Tooltip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const ContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/contacts/');
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message || 'Failed to load contacts');
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

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
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