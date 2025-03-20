import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Grid, Paper, Button, 
  Divider, CircularProgress, Chip, Alert, Card, CardContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import UpdateIcon from '@mui/icons-material/Update';
import { message, Modal } from 'antd';
import api from '../../services/api';

const DepartmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch department data
  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setLoading(true);
        
        // Try multiple endpoints
        const endpoints = [
          `departments/${id}/`,
          `users/departments/${id}/`,
          `auth/departments/${id}/`
        ];
        
        let response = null;
        let lastError = null;
        
        for (const endpoint of endpoints) {
          try {
            response = await api.get(endpoint);
            break;
          } catch (error) {
            console.error(`Failed to fetch from ${endpoint}:`, error);
            lastError = error;
          }
        }
        
        if (!response) {
          throw lastError || new Error('Failed to fetch department data');
        }
        
        setDepartment(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching department:', error);
        setError('Failed to load department data. Please try again.');
        setLoading(false);
      }
    };

    fetchDepartment();
  }, [id]);

  // Handle department deletion
  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Department',
      content: `Are you sure you want to delete the department "${department?.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Try multiple endpoints for deletion
          const endpoints = [
            `departments/${id}/`,
            `users/departments/${id}/`,
            `auth/departments/${id}/`
          ];
          
          let success = false;
          let lastError = null;
          
          for (const endpoint of endpoints) {
            try {
              await api.delete(endpoint);
              success = true;
              break;
            } catch (error) {
              console.error(`Failed to delete with endpoint ${endpoint}:`, error);
              lastError = error;
            }
          }
          
          if (!success) {
            throw lastError || new Error('All deletion attempts failed');
          }
          
          message.success('Department deleted successfully');
          navigate('/dashboard/departments');
        } catch (error) {
          console.error('Error deleting department:', error);
          message.error('Failed to delete department');
        }
      }
    });
  };

  // Navigate to edit page
  const handleEdit = () => {
    navigate(`/dashboard/departments/${id}/edit`);
  };

  // Navigate back to departments list
  const handleBack = () => {
    navigate('/dashboard/departments');
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

  if (!department) {
    return (
      <Container maxWidth="md" sx={{ pt: 4, pb: 4 }}>
        <Alert severity="warning">Department not found</Alert>
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
            Back to Departments
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
        
        {/* Department Details */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
                {department.name}
              </Typography>
              <Chip 
                label={department.is_active ? 'Active' : 'Inactive'}
                size="medium"
                sx={{ 
                  borderRadius: '4px',
                  backgroundColor: department.is_active ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                  color: department.is_active ? 'rgb(46, 204, 113)' : 'rgb(231, 76, 60)',
                  fontWeight: 500
                }} 
              />
            </Box>
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {department.description || 'No description provided.'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Department Info Card */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Department Information
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {/* Department ID */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CategoryIcon sx={{ color: 'text.secondary', mr: 1 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Department ID
                        </Typography>
                        <Typography variant="body1">
                          {department.id}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Tenant ID */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CategoryIcon sx={{ color: 'text.secondary', mr: 1 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Tenant ID
                        </Typography>
                        <Typography variant="body1">
                          {department.tenant || 'N/A'}
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
                          {formatDate(department.created_at)}
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
                          {formatDate(department.updated_at)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Department Usage Info */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Associated Data
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Alert severity="info">
                    This department can be assigned to users and teams. Users and teams assigned to this department can be managed from their respective sections.
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

export default DepartmentDetail; 