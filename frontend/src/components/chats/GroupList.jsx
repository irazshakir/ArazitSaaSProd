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
import GroupIcon from '@mui/icons-material/Group';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const GroupList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noApiConfigured, setNoApiConfigured] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setNoApiConfigured(false);
      
      // Get tenant ID from localStorage
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/groups/', {
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
          throw new Error(errorData.error || errorData.errMsg || 'Failed to load groups');
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
        throw new Error(data.errMsg || 'Failed to load groups');
      }
      
      setGroups(data.groups || []);
    } catch (error) {
      setError('Error fetching groups: ' + error.message);
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
          WhatsApp Groups
        </Typography>
        <Alert severity="warning">
          No WhatsApp API configured for this tenant. Please configure your WhatsApp API settings to start using groups.
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography variant="h6" gutterBottom>
          WhatsApp Groups
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h6" mb={3}>
        WhatsApp Groups
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Group</TableCell>
              <TableCell>Members</TableCell>
              <TableCell>Last Message</TableCell>
              <TableCell>Last Reply</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {group.avatar ? (
                        <img src={group.avatar} alt={group.name} />
                      ) : (
                        <GroupIcon />
                      )}
                    </Avatar>
                    <Typography>{group.name || 'Unknown'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{group.member_count || 0} members</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {group.last_message}
                    {group.is_last_message_by_contact === 1 && (
                      <Tooltip title="Last message by contact">
                        <ChatIcon sx={{ ml: 1, color: 'primary.main' }} />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{formatDate(group.last_reply_at)}</TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    {group.has_chat === 1 && (
                      <Tooltip title="Has active chat">
                        <ChatIcon color="primary" />
                      </Tooltip>
                    )}
                    {group.resolved_chat === 1 && (
                      <Tooltip title="Chat resolved">
                        <CheckCircleIcon color="success" />
                      </Tooltip>
                    )}
                    {group.enabled_ai_bot === 1 && (
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

export default GroupList; 