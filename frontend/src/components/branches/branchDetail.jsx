import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Grid, Paper, Button, 
  Divider, CircularProgress, Chip, Alert, Card, CardContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import UpdateIcon from '@mui/icons-material/Update';
import { message, Modal } from 'antd';
import api from '../../services/api';

const BranchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch branch data
  useEffect(() => {
    const fetchBranch = async () => {
      try {
        setLoading(true);
        const response = await api.get(`branches/${id}/`);
        setBranch(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching branch:', error);
        setError('Failed to load branch data. Please try again.');
        setLoading(false);
      }
    };

    fetchBranch();
  }, [id]);

  // Handle branch deletion
  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Branch',
      content: `Are you sure you want to delete the branch "${branch?.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await api.delete(`branches/${id}/`);
          message.success('Branch deleted successfully');
          navigate('/dashboard/branches');
        } catch (error) {
          console.error('Error deleting branch:', error);
          message.error('Failed to delete branch');
        }
      }
    });
  };

  // Navigate to edit page
  const handleEdit = () => {
    navigate(`/dashboard/branches/${id}/edit`);
  };

  // Navigate back to branches list
  const handleBack = () => {
    navigate('/dashboard/branches');
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ pt: 4, pb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ pt: 4, pb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!branch) {
    return (
      <Container maxWidth="md" sx={{ pt: 4, pb: 4 }}>
        <Alert severity="warning">Branch not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ pt: 2, pb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: 'white'
        }}
      >
        {/* Header with back button and actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            variant="text"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Branches
          </Button>
          
          <Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ mr: 2 }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Branch Details */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
                {branch.name}
              </Typography>
              <Chip 
                label={branch.is_active ? 'Active' : 'Inactive'}
                size="medium"
                sx={{ 
                  borderRadius: '4px',
                  backgroundColor: branch.is_active ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                  color: branch.is_active ? 'rgb(46, 204, 113)' : 'rgb(231, 76, 60)',
                  fontWeight: 500
                }} 
              />
            </Box>
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {branch.description || 'No description provided.'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Branch Info Card */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Branch Information
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {/* Branch ID */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon sx={{ color: 'text.secondary', mr: 1 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Branch ID
                        </Typography>
                        <Typography variant="body1">
                          {branch.id}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Tenant ID */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon sx={{ color: 'text.secondary', mr: 1 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Tenant ID
                        </Typography>
                        <Typography variant="body1">
                          {branch.tenant || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Created Date */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarTodayIcon sx={{ color: 'text.secondary', mr: 1 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Created
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(branch.created_at)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Last Updated */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <UpdateIcon sx={{ color: 'text.secondary', mr: 1 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Last Updated
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(branch.updated_at)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Branch Teams and Users - Could be expanded in the future */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Associated Data
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Alert severity="info">
                    This branch can be assigned to users and teams. Manage users and teams from their respective sections.
                  </Alert>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default BranchDetail; 