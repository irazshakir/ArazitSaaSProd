import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Divider, List, ListItem, 
  ListItemAvatar, ListItemText, Avatar, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, TextField, CircularProgress
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import { message } from 'antd';
import api from '../../services/api';

const TeamMembers = ({ teamId, teamData, onTeamUpdate }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [tenantId, setTenantId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // Get tenant ID from localStorage
  useEffect(() => {
    try {
      const tenantId = localStorage.getItem('tenant_id');
      setTenantId(tenantId);
    } catch (error) {
      console.error('Error getting tenant ID:', error);
    }
  }, []);
  
  // Fetch team members when team ID changes
  useEffect(() => {
    if (teamId) {
      fetchTeamMembers();
    }
  }, [teamId]);
  
  // Filter available users when search query changes
  useEffect(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = availableUsers.filter(user => 
        user.email.toLowerCase().includes(lowercasedQuery) ||
        (user.first_name && user.first_name.toLowerCase().includes(lowercasedQuery)) ||
        (user.last_name && user.last_name.toLowerCase().includes(lowercasedQuery))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(availableUsers);
    }
  }, [searchQuery, availableUsers]);
  
  // Fetch team members from API
  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`teams/${teamId}/members/`);
      
      const membersData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      
      setMembers(membersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching team members:', error);
      message.error('Failed to load team members');
      setLoading(false);
    }
  };
  
  // Open add member dialog
  const handleOpenDialog = async () => {
    if (!teamData || !tenantId) {
      message.error('Missing team data or tenant information');
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch available users that can be added to this team
      const response = await api.get('users/', {
        params: {
          tenant: tenantId,
          branch: teamData.branch?.id,
          department: teamData.department?.id,
          role__in: 'sales_agent,support_agent,processor',
          not_in_team: teamId
        }
      });
      
      const usersData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      
      setAvailableUsers(usersData);
      setFilteredUsers(usersData);
      setLoading(false);
      setDialogOpen(true);
    } catch (error) {
      console.error('Error fetching available users:', error);
      message.error('Failed to load available users');
      setLoading(false);
    }
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser('');
    setSearchQuery('');
  };
  
  // Handle user selection
  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Add member to team
  const handleAddMember = async () => {
    if (!selectedUser) {
      message.error('Please select a user');
      return;
    }
    
    try {
      setLoading(true);
      
      // Add member to team
      await api.post(`teams/${teamId}/add_member/`, {
        user_id: selectedUser
      });
      
      message.success('Member added to team successfully');
      
      // Refresh team members
      await fetchTeamMembers();
      
      // Close dialog
      handleCloseDialog();
      
      // Notify parent component of the update
      if (onTeamUpdate) {
        onTeamUpdate();
      }
    } catch (error) {
      console.error('Error adding member to team:', error);
      message.error('Failed to add member to team');
      setLoading(false);
    }
  };
  
  // Remove member from team
  const handleRemoveMember = async (memberId) => {
    try {
      setLoading(true);
      
      // Remove member from team
      await api.post(`teams/${teamId}/remove_member/`, {
        user_id: memberId
      });
      
      message.success('Member removed from team successfully');
      
      // Update local members list
      setMembers(members.filter(member => member.user.id !== memberId));
      setLoading(false);
      
      // Notify parent component of the update
      if (onTeamUpdate) {
        onTeamUpdate();
      }
    } catch (error) {
      console.error('Error removing member from team:', error);
      message.error('Failed to remove member from team');
      setLoading(false);
    }
  };
  
  // Format user display name
  const formatUserName = (user) => {
    if (!user) return 'Unknown User';
    
    const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return displayName || user.email;
  };
  
  // Get user role display name
  const getUserRoleDisplay = (role) => {
    switch (role) {
      case 'sales_agent':
        return 'Sales Agent';
      case 'support_agent':
        return 'Support Agent';
      case 'processor':
        return 'Processor';
      default:
        return role;
    }
  };
  
  // Get avatar letter (first letter of name or email)
  const getAvatarLetter = (user) => {
    if (!user) return '?';
    
    if (user.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    
    return user.email.charAt(0).toUpperCase();
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        backgroundColor: 'white',
        mb: 3
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          Team Members
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenDialog}
          disabled={loading}
        >
          Add Member
        </Button>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {loading && members.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : members.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No members in this team yet. Click "Add Member" to add team members.
          </Typography>
        </Box>
      ) : (
        <List>
          {members.map((member) => (
            <ListItem
              key={member.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleRemoveMember(member.user.id)}
                  disabled={loading}
                >
                  <DeleteIcon />
                </IconButton>
              }
              sx={{ 
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': {
                  borderBottom: 'none'
                }
              }}
            >
              <ListItemAvatar>
                <Avatar src={member.user.profile_picture}>
                  {getAvatarLetter(member.user)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={formatUserName(member.user)}
                secondary={
                  <React.Fragment>
                    <Typography component="span" variant="body2" color="text.primary">
                      {member.user.email}
                    </Typography>
                    {" — "}
                    {getUserRoleDisplay(member.user.role)}
                  </React.Fragment>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
      
      {/* Add Member Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Team Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search Users"
            type="text"
            fullWidth
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel id="select-user-label">Select User</InputLabel>
            <Select
              labelId="select-user-label"
              id="select-user"
              value={selectedUser}
              onChange={handleUserChange}
              label="Select User"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {filteredUsers.map(user => (
                <MenuItem key={user.id} value={user.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar 
                      src={user.profile_picture} 
                      sx={{ width: 24, height: 24 }}
                    >
                      {getAvatarLetter(user)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">
                        {formatUserName(user)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email} • {getUserRoleDisplay(user.role)}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleAddMember} 
            color="primary"
            disabled={!selectedUser || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TeamMembers; 