import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { ContentCopy, Refresh } from '@mui/icons-material';
import { getUser, ensureAuthenticated } from '../../../utils/auth';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const FbSettings = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(getUser());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [salesAgents, setSalesAgents] = useState([]);
  
  const [settings, setSettings] = useState({
    is_active: false,
    default_assigned_to: [],
    webhook_secret: '',
    albato_integration_id: '',
  });

  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    if (!ensureAuthenticated()) {
      navigate('/login');
      return;
    }

    const user = getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setUserData(user);
    
    if (user.tenant_id) {
      setWebhookUrl(`https://api.arazit.com/api/webhook/facebook/${user.tenant_id}/`);
    }
  }, [navigate]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!userData?.tenant_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const settingsResponse = await api.get(`webhook/facebook/settings/`, {
          params: { tenant: userData.tenant_id }
        });

        if (settingsResponse.data) {
          const settingsData = {
            ...settingsResponse.data,
            default_assigned_to: Array.isArray(settingsResponse.data.default_assigned_to) 
              ? settingsResponse.data.default_assigned_to 
              : []
          };
          setSettings(settingsData);
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          setError(err.response?.data?.message || 'Failed to load settings. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      fetchSettings();
    }
  }, [userData]);

  useEffect(() => {
    const fetchSalesAgents = async () => {
      try {
        const tenantId = localStorage.getItem('tenant_id');
        
        if (!tenantId) return;

        const response = await api.get('/auth/active-by-tenant/', {
          params: { tenant: tenantId }
        });

        let usersArray = Array.isArray(response.data) 
          ? response.data
          : (response.data?.results && Array.isArray(response.data.results))
            ? response.data.results
            : [];
        
        const salesAgentsArray = usersArray.filter(user => 
          user.role === 'sales_agent' && user.is_active !== false
        );
        
        const formattedAgents = salesAgentsArray.map(agent => ({
          id: agent.id,
          name: `${agent.first_name} ${agent.last_name}`,
          email: agent.email
        }));
        
        setSalesAgents(formattedAgents);
      } catch (error) {
        setSalesAgents([]);
      }
    };
    
    fetchSalesAgents();
  }, []);

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    if (name === 'is_active') {
      setSettings(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'default_assigned_to') {
      setSettings(prev => ({
        ...prev,
        [name]: Array.isArray(value) ? value : []
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const generateWebhookSecret = () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setSettings(prev => ({
      ...prev,
      webhook_secret: secret
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...settings,
        tenant: userData.tenant_id,
        default_assigned_to: Array.isArray(settings.default_assigned_to) 
          ? settings.default_assigned_to 
          : []
      };

      const response = await api.put('webhook/facebook/settings/', payload);
      setSettings(response.data);
      setSuccess('Settings saved successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.detail || 
                         `Failed to save settings (${err.response?.status}). Please try again.`;
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Facebook Lead Form Integration Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Webhook URL
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              value={webhookUrl}
              variant="outlined"
              size="small"
              InputProps={{ readOnly: true }}
            />
            <Tooltip title="Copy URL">
              <IconButton onClick={() => copyToClipboard(webhookUrl)}>
                <ContentCopy />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Use this URL in your Albato integration settings.
          </Typography>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent>
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Enable Integration
              </Typography>
              <Switch
                name="is_active"
                checked={settings.is_active}
                onChange={handleChange}
              />
            </Box>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Default Sales Agents</InputLabel>
              <Select
                multiple
                name="default_assigned_to"
                value={settings.default_assigned_to || []}
                onChange={handleChange}
                label="Default Sales Agents"
                required
              >
                {loading ? (
                  <MenuItem disabled>Loading sales agents...</MenuItem>
                ) : salesAgents.length > 0 ? (
                  salesAgents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.email})
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No active sales agents found</MenuItem>
                )}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {loading ? 'Loading...' : 
                  salesAgents.length > 0 
                    ? 'Selected agents will receive leads in a round-robin fashion.'
                    : 'Please add active sales agents to enable lead assignment.'}
              </Typography>
            </FormControl>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Webhook Secret
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  name="webhook_secret"
                  value={settings.webhook_secret}
                  onChange={handleChange}
                  variant="outlined"
                  size="small"
                  InputProps={{ readOnly: true }}
                />
                <Tooltip title="Generate New Secret">
                  <IconButton onClick={generateWebhookSecret}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This secret key is used to verify webhook requests from Albato.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Albato Integration ID"
                name="albato_integration_id"
                value={settings.albato_integration_id}
                onChange={handleChange}
                helperText="Enter the integration ID provided by Albato"
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
              >
                {saving ? <CircularProgress size={24} /> : 'Save Settings'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </form>
    </Box>
  );
};

export default FbSettings; 