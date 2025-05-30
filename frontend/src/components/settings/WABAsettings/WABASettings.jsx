import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Divider, 
  Grid, 
  TextField, 
  Typography, 
  Switch, 
  FormControlLabel,
  Alert,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import wabaService from '../../../services/wabaService';
import { getUser } from '../../../utils/auth';

const WABASettings = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    api_url: 'https://apps.oncloudapi.com',
    email: '',
    password: '',
    is_active: true,
    api_key: '',
    api_secret: '',
    phone_number_id: '',
    business_account_id: '',
    webhook_verify_token: '',
    webhook_url: ''
  });

  // State for password confirmation and validation
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        // Get the current user to access tenant_id
        const user = getUser();
        if (!user || !user.tenant_id) {
          setSnackbar({
            open: true,
            message: 'User or tenant information not found',
            severity: 'error'
          });
          setLoading(false);
          return;
        }
        
        const data = await wabaService.getSettings();
        
        // Check if we have valid data
        if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
          // Keep the default form data
          setLoading(false);
          return;
        }
        
        // Ensure all form fields have at least empty strings instead of null
        // And convert is_active to boolean
        const sanitizedData = Object.keys(formData).reduce((acc, key) => {
          if (key === 'is_active') {
            // Ensure is_active is boolean
            acc[key] = data[key] === true || data[key] === 'true' || data[key] === 1;
          } else {
            acc[key] = data[key] === null || data[key] === undefined ? '' : data[key];
          }
          return acc;
        }, {});
        
        setFormData(sanitizedData);
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to load WABA settings',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'password') {
      // Clear password error when user types in password field
      setPasswordError('');
    }
    
    setFormData({
      ...formData,
      [name]: name === 'is_active' ? checked : (value || '')
    });
  };
  
  const handlePasswordConfirmChange = (e) => {
    setPasswordConfirm(e.target.value || '');
    setPasswordError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate passwords match if password is being changed
    if (formData.password && formData.password !== passwordConfirm) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setSaving(true);
    try {
      // Create a copy of the data to send
      const dataToSend = { ...formData };
      
      // If id is empty, remove it to ensure proper creation of a new record
      if (!dataToSend.id) {
        delete dataToSend.id;
      }
      
      // If this is an update and password is empty, remove it to avoid overwriting with empty value
      if (dataToSend.id && !dataToSend.password) {
        delete dataToSend.password;
      }
      
      const savedSettings = await wabaService.saveSettings(dataToSend);
      
      // Update the form data but clear the password fields for security
      const updatedFormData = { ...savedSettings, password: '' };
      setFormData(updatedFormData);
      setPasswordConfirm('');
      
      setSnackbar({
        open: true,
        message: 'WABA settings saved successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to save WABA settings',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading WABA settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            WhatsApp Business API Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure your WhatsApp Business API integration settings here.
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="API URL"
                  name="api_url"
                  value={formData.api_url}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  margin="normal"
                  required={!formData.id} // Only required for new settings
                />
                {passwordError && (
                  <Typography color="error" variant="caption">
                    {passwordError}
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={handlePasswordConfirmChange}
                  margin="normal"
                  required={!formData.id || formData.password.length > 0} // Required for new settings or when password is being changed
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={handleChange}
                      name="is_active"
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  API Configuration
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="API Key"
                  name="api_key"
                  value={formData.api_key}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="API Secret"
                  name="api_secret"
                  value={formData.api_secret}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number ID"
                  name="phone_number_id"
                  value={formData.phone_number_id}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business Account ID"
                  name="business_account_id"
                  value={formData.business_account_id}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Webhook Configuration
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Webhook Verify Token"
                  name="webhook_verify_token"
                  value={formData.webhook_verify_token}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Webhook URL"
                  name="webhook_url"
                  value={formData.webhook_url}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WABASettings; 