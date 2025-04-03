import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  FormHelperText,
  CircularProgress,
  Chip,
  OutlinedInput
} from '@mui/material';
import api from '../../services/api';
import { message } from 'antd';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export const GroupForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    client_ids: [], // Changed to array for multiple selections
    status: 'in process'
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch clients list (from leads API)
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const tenantId = localStorage.getItem('tenant_id');
        
        // Try multiple API endpoints to get potential clients
        let clientsData = [];
        
        // First, try to get leads by role (which should work for all users)
        console.log('Attempting to fetch clients from leads/by-role/ endpoint');
        try {
          const roleResponse = await api.get('leads/by-role/', { 
            params: { tenant: tenantId } 
          });
          
          const roleData = Array.isArray(roleResponse.data) 
            ? roleResponse.data
            : (roleResponse.data?.results && Array.isArray(roleResponse.data.results))
              ? roleResponse.data.results
              : [];
              
          if (roleData.length > 0) {
            console.log(`Found ${roleData.length} leads from by-role endpoint`);
            clientsData = roleData;
          }
        } catch (roleError) {
          console.error('Error fetching leads by role:', roleError);
        }
        
        // If still no data, try regular leads endpoint
        if (clientsData.length === 0) {
          console.log('Attempting to fetch clients from leads/ endpoint');
          try {
            const leadsResponse = await api.get('leads/', { 
              params: { tenant: tenantId } 
            });
            
            const leadsData = Array.isArray(leadsResponse.data) 
              ? leadsResponse.data
              : (leadsResponse.data?.results && Array.isArray(leadsResponse.data.results))
                ? leadsResponse.data.results
                : [];
                
            if (leadsData.length > 0) {
              console.log(`Found ${leadsData.length} leads from leads endpoint`);
              clientsData = leadsData;
            }
          } catch (leadsError) {
            console.error('Error fetching leads:', leadsError);
          }
        }
        
        // If neither of the above work, try by-status with 'new' status as last resort
        if (clientsData.length === 0) {
          console.log('Attempting to fetch clients from leads/by-status/ with new status');
          try {
            const newLeadsResponse = await api.get('leads/by-status/', { 
              params: { 
                tenant: tenantId,
                status: 'new' 
              } 
            });
            
            const newLeadsData = Array.isArray(newLeadsResponse.data) 
              ? newLeadsResponse.data
              : (newLeadsResponse.data?.results && Array.isArray(newLeadsResponse.data.results))
                ? newLeadsResponse.data.results
                : [];
                
            if (newLeadsData.length > 0) {
              console.log(`Found ${newLeadsData.length} leads with new status`);
              clientsData = newLeadsData;
            }
          } catch (newLeadsError) {
            console.error('Error fetching new leads:', newLeadsError);
          }
        }
        
        // Remove potential duplicates by ID
        const uniqueClients = Array.from(new Map(clientsData.map(client => 
          [client.id, client]
        )).values());
        
        console.log(`Final unique clients list: ${uniqueClients.length} items`);
        setClients(uniqueClients);
        
      } catch (error) {
        console.error('Error in client fetching process:', error);
        message.error('Failed to load clients. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    }
    
    if (!formData.client_ids || formData.client_ids.length === 0) {
      newErrors.client_ids = 'Please select at least one client';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
  };

  // Get client name by ID
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : '';
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Group Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.client_ids}>
            <InputLabel id="client-label">Clients</InputLabel>
            <Select
              labelId="client-label"
              multiple
              name="client_ids"
              value={formData.client_ids}
              onChange={handleChange}
              input={<OutlinedInput label="Clients" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip 
                      key={value} 
                      label={getClientName(value)}
                      sx={{ 
                        backgroundColor: '#9d277c1a',
                        color: '#9d277c',
                        '& .MuiChip-deleteIcon': {
                          color: '#9d277c',
                          '&:hover': {
                            color: '#7a1d61'
                          }
                        }
                      }}
                    />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
              disabled={loading}
            >
              {loading ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Loading clients...
                </MenuItem>
              ) : clients.length > 0 ? (
                clients.map(client => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No clients found</MenuItem>
              )}
            </Select>
            {errors.client_ids && <FormHelperText>{errors.client_ids}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              name="status"
              value={formData.status}
              label="Status"
              onChange={handleChange}
            >
              <MenuItem value="in process">In Process</MenuItem>
              <MenuItem value="travelled">Travelled</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={{
                borderColor: '#9d277c',
                color: '#9d277c',
                '&:hover': {
                  borderColor: '#7a1d61',
                  backgroundColor: 'rgba(157, 39, 124, 0.04)'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: '#9d277c',
                '&:hover': {
                  backgroundColor: '#7a1d61'
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Group'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};
