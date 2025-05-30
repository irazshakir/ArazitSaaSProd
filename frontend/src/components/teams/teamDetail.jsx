import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Grid, Paper, Button, Chip,
  Divider, CircularProgress, Avatar, Stack, Card, CardContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import { message, Modal } from 'antd';
import api from '../../services/api';

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Load team data
  useEffect(() => {
    fetchTeam();
  }, [id]);
  
  // Fetch team data from API
  const fetchTeam = async () => {
    try {
      setLoading(true);
      
      // First try to get the team details
      const teamResponse = await api.get(`teams/${id}/`);
      
      // Then try to get the team hierarchy which includes managers, team leads, and members
      try {
        const hierarchyResponse = await api.get(`teams/${id}/hierarchy/`);
        
        // Combine the data
        const combinedData = {
          ...teamResponse.data,
          managers: hierarchyResponse.data.managers || []
        };
        
        console.log('Team data with hierarchy:', combinedData);
        setTeam(combinedData);
      } catch (hierarchyError) {
        console.error('Error fetching team hierarchy:', hierarchyError);
        
        // Try alternative endpoint
        try {
          const altHierarchyResponse = await api.get(`auth/teams/${id}/hierarchy/`);
          
          // Combine the data
          const combinedData = {
            ...teamResponse.data,
            managers: altHierarchyResponse.data.managers || []
          };
          
          console.log('Team data with hierarchy (alt endpoint):', combinedData);
          setTeam(combinedData);
        } catch (altError) {
          console.error('Error fetching team hierarchy from alt endpoint:', altError);
          
          // If both hierarchy fetches fail, try to get managers, team leads, and members separately
          try {
            // Get managers
            const managersResponse = await api.get(`teams/${id}/managers/`);
            const managers = managersResponse.data;
            
            // For each manager, get team leads
            const managersWithTeamLeads = await Promise.all(
              managers.map(async (manager) => {
                try {
                  const teamLeadsResponse = await api.get(`team-managers/${manager.id}/team_leads/`);
                  const teamLeads = teamLeadsResponse.data;
                  
                  // For each team lead, get members
                  const teamLeadsWithMembers = await Promise.all(
                    teamLeads.map(async (teamLead) => {
                      try {
                        const membersResponse = await api.get(`team-leads/${teamLead.id}/members/`);
                        return {
                          ...teamLead,
                          members: membersResponse.data
                        };
                      } catch (error) {
                        return {
                          ...teamLead,
                          members: []
                        };
                      }
                    })
                  );
                  
                  return {
                    ...manager,
                    team_leads: teamLeadsWithMembers
                  };
                } catch (error) {
                  return {
                    ...manager,
                    team_leads: []
                  };
                }
              })
            );
            
            // Combine the data
            const combinedData = {
              ...teamResponse.data,
              managers: managersWithTeamLeads
            };
            
            console.log('Team data with manually constructed hierarchy:', combinedData);
            setTeam(combinedData);
          } catch (manualError) {
            console.error('Error constructing team hierarchy manually:', manualError);
            // If all hierarchy fetches fail, still use the basic team data
            setTeam(teamResponse.data);
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching team:', error);
      message.error('Failed to load team details');
      setLoading(false);
      
      // Navigate back to teams list if team not found
      if (error.response?.status === 404) {
        navigate('/dashboard/teams');
      }
    }
  };
  
  // Handle edit team
  const handleEditTeam = () => {
    navigate(`/dashboard/teams/${id}/edit`);
  };
  
  // Handle delete team
  const handleDeleteTeam = () => {
    Modal.confirm({
      title: 'Delete Team',
      content: `Are you sure you want to delete the team "${team?.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await api.delete(`teams/${id}/`);
          message.success('Team deleted successfully');
          navigate('/dashboard/teams');
        } catch (error) {
          console.error('Error deleting team:', error);
          message.error('Failed to delete team');
        }
      }
    });
  };
  
  // Handle navigate back
  const handleBack = () => {
    navigate('/dashboard/teams');
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get avatar letter (first letter of name or email)
  const getAvatarLetter = (user) => {
    if (!user) return '?';
    
    if (user.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    
    return user.email.charAt(0).toUpperCase();
  };
  
  // Format user display name
  const formatUserName = (user) => {
    if (!user) return 'Not Assigned';
    
    const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return displayName || user.email;
  };
  
  if (loading && !team) {
    return (
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ pt: 2, pb: 4 }}>
      {/* Header with back button and actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          variant="text"
          color="inherit"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Teams
        </Button>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleEditTeam}
          >
            Edit Team
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteTeam}
          >
            Delete
          </Button>
        </Stack>
      </Box>
      
      {/* Team Info Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: 'white',
          mb: 3
        }}
      >
        <Grid container spacing={3}>
          {/* Team Name and Creation Date */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
                {team?.name}
              </Typography>
              <Chip
                label={`Created ${formatDate(team?.created_at)}`}
                variant="outlined"
                size="small"
              />
            </Box>
            
            {team?.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {team.description}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          {/* Organization Details */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
                  Organization Details
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body1">
                    <strong>Branch:</strong> {team?.branch?.name || 'Not Assigned'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GroupsIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body1">
                    <strong>Department:</strong> {team?.department?.name || 'Not Assigned'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Leadership Details */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
                  Leadership
                </Typography>
                
                {/* Department Head */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    src={team?.department_head_details?.profile_picture}
                    sx={{ mr: 2, bgcolor: 'primary.main' }}
                  >
                    {team?.department_head_details ? getAvatarLetter(team.department_head_details) : 'DH'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Department Head
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatUserName(team?.department_head_details) || 'Not Assigned'}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Manager (first manager from hierarchy) */}
                {team?.managers && team.managers.length > 0 && team.managers[0].manager_details && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      src={team.managers[0].manager_details.profile_picture}
                      sx={{ mr: 2, bgcolor: 'secondary.main' }}
                    >
                      {getAvatarLetter(team.managers[0].manager_details)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Manager
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formatUserName(team.managers[0].manager_details)}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {/* Team Lead (first team lead from first manager) */}
                {team?.managers && 
                 team.managers.length > 0 && 
                 team.managers[0].team_leads && 
                 team.managers[0].team_leads.length > 0 && 
                 team.managers[0].team_leads[0].team_lead_details && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      src={team.managers[0].team_leads[0].team_lead_details.profile_picture}
                      sx={{ mr: 2, bgcolor: 'info.main' }}
                    >
                      {getAvatarLetter(team.managers[0].team_leads[0].team_lead_details)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Team Lead
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formatUserName(team.managers[0].team_leads[0].team_lead_details)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Team Members Section */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
                  Team Members
                </Typography>
                
                {team?.managers && team.managers.length > 0 ? (
                  <Box>
                    {team.managers.map((manager, managerIndex) => (
                      <Box key={manager.id || managerIndex} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                          Manager: {formatUserName(manager.manager_details)}
                        </Typography>
                        
                        {manager.team_leads && manager.team_leads.length > 0 ? (
                          manager.team_leads.map((teamLead, teamLeadIndex) => (
                            <Box key={teamLead.id || teamLeadIndex} sx={{ ml: 3, mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>
                                Team Lead: {formatUserName(teamLead.team_lead_details)}
                              </Typography>
                              
                              {teamLead.members && teamLead.members.length > 0 ? (
                                <Grid container spacing={1} sx={{ ml: 1 }}>
                                  {teamLead.members.map((member, memberIndex) => (
                                    <Grid item key={member.id || memberIndex}>
                                      <Chip
                                        avatar={
                                          <Avatar>
                                            {getAvatarLetter(member.member_details)}
                                          </Avatar>
                                        }
                                        label={formatUserName(member.member_details)}
                                        variant="outlined"
                                      />
                                    </Grid>
                                  ))}
                                </Grid>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                  No members assigned to this team lead.
                                </Typography>
                              )}
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                            No team leads assigned to this manager.
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No team structure defined yet. Please edit the team to add managers, team leads, and members.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Team Statistics Card - can be expanded later */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: 'white'
        }}
      >
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
          Team Statistics
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h3" color="primary.main">
                {team?.members?.length || 0}
              </Typography>
              <Typography variant="body1">Team Members</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h3" color="primary.main">
                {/* This would come from your API if you track open leads per team */}
                0
              </Typography>
              <Typography variant="body1">Active Leads</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h3" color="primary.main">
                {/* This would come from your API if you track closed leads per team */}
                0
              </Typography>
              <Typography variant="body1">Completed Leads</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default TeamDetail; 