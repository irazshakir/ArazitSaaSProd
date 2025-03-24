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
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const GroupList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContacts, setShowContacts] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [showContacts]);

  const fetchGroups = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/groups/?showContacts=${showContacts ? 'yes' : 'no'}`);
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message || 'Failed to load groups');
      }
      
      setGroups(data.groups || []);
    } catch (error) {
      setError('Error fetching groups: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = (groupId) => {
    // TODO: Implement add contact functionality
    console.log('Add contact to group:', groupId);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          WhatsApp Groups
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showContacts}
              onChange={(e) => setShowContacts(e.target.checked)}
              name="showContacts"
            />
          }
          label="Show Contacts"
        />
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Updated At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <GroupIcon sx={{ mr: 1 }} />
                    {group.name}
                  </Box>
                </TableCell>
                <TableCell>{new Date(group.created_at).toLocaleString()}</TableCell>
                <TableCell>{new Date(group.updated_at).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Add Contact">
                    <IconButton onClick={() => handleAddContact(group.id)}>
                      <PersonAddIcon />
                    </IconButton>
                  </Tooltip>
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