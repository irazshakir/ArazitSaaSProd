import React, { useState, useEffect, useRef } from 'react';
import { Container, Grid, Paper, Typography, Box } from '@mui/material';
import { Form, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

import LocationRoutingForm from './LocationRoutingForm';
import TableList from '../universalComponents/tableList';
import TableSkeleton from '../universalComponents/tableSkeleton';
import CreateButton from '../universalComponents/createButton';

const LocationRoutingIndex = () => {
  const [loading, setLoading] = useState(true);
  const [routingConfigs, setRoutingConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [form] = Form.useForm();
  const formRef = useRef();
  const navigate = useNavigate();

  // Fetch all routing configurations
  const fetchRoutingConfigs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenant_id');

      const response = await api.get('/location-routing/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: {
          tenant: tenantId
        }
      });

      if (response.data) {
        setRoutingConfigs(response.data.results || response.data);
      }
    } catch (error) {
      message.error('Failed to load routing configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutingConfigs();
  }, []);

  // Table columns configuration
  const columns = [
    {
      field: 'locations',
      headerName: 'CITIES',
      width: '30%',
      render: (value) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Array.isArray(value) ? value.map((city, index) => (
            <span key={index} style={{ 
              backgroundColor: '#e6f4ff', 
              padding: '2px 8px', 
              borderRadius: '4px',
              fontSize: '0.85rem'
            }}>
              {city}
            </span>
          )) : null}
        </Box>
      )
    },
    {
      field: 'assigned_users',
      headerName: 'ASSIGNED USERS',
      width: '40%',
      render: (value) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.values(value || {}).map((user, index) => (
            <span key={index} style={{ 
              backgroundColor: '#f6ffed', 
              padding: '2px 8px', 
              borderRadius: '4px',
              fontSize: '0.85rem'
            }}>
              {user.name}
            </span>
          ))}
        </Box>
      )
    },
    {
      field: 'is_active',
      headerName: 'STATUS',
      width: '15%',
      render: (value) => (
        <span style={{ 
          backgroundColor: value ? '#f6ffed' : '#fff1f0',
          color: value ? '#52c41a' : '#ff4d4f',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '0.85rem'
        }}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      field: 'created_at',
      headerName: 'CREATED',
      width: '15%',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

  // Handle create new configuration
  const handleCreateNew = () => {
    setSelectedConfig(null);
    form.resetFields();
  };

  // Handle edit configuration
  const handleEditConfig = (config) => {
    setSelectedConfig(config);
    form.setFieldsValue(config);
  };

  // Handle delete configuration
  const handleDeleteConfig = async (config) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/location-routing/${config.id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      message.success('Configuration deleted successfully');
      fetchRoutingConfigs();
    } catch (error) {
      message.error('Failed to delete configuration');
    }
  };

  // Handle save
  const handleSave = async () => {
    try {
      const data = await formRef.current.saveLocationRouting();
      fetchRoutingConfigs();
      setSelectedConfig(null);
      form.resetFields();
      return data;
    } catch (error) {
      // Error is already handled in the form component
      throw error;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      <Grid container spacing={3}>
        {/* Form Section */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedConfig ? 'Edit Location Routing' : 'Create Location Routing'}
              </Typography>
              
              <CreateButton
                onClick={handleCreateNew}
                buttonText="New Configuration"
                icon="add"
                disabled={!selectedConfig}
              />
            </Box>

            <LocationRoutingForm
              ref={formRef}
              form={form}
              initialData={selectedConfig}
              onSave={handleSave}
            />
          </Paper>
        </Grid>

        {/* List Section */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Existing Configurations
            </Typography>

            {loading ? (
              <TableSkeleton columns={4} rows={5} />
            ) : (
              <TableList
                columns={columns}
                data={routingConfigs}
                onEditClick={handleEditConfig}
                onDeleteClick={handleDeleteConfig}
                pagination={true}
                rowsPerPage={10}
                rowsPerPageOptions={[5, 10, 25]}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LocationRoutingIndex; 