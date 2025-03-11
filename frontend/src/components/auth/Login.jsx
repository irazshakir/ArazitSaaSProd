import { useState } from 'react';
import { 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Box, 
  Alert, 
  InputAdornment, 
  IconButton,
  Divider,
  Link as MuiLink,
  Container
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { Visibility, VisibilityOff, Google, Microsoft } from '@mui/icons-material';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(formData.email, formData.password);
      
      // Log the user data for debugging
      console.log('Login response:', response);
      console.log('User data:', response.user);
      
      // Add more detailed logging of user properties
      if (response.user) {
        console.log('User ID:', response.user.id);
        console.log('Tenant properties:');
        console.log('- tenant_id:', response.user.tenant_id);
        console.log('- tenant:', response.user.tenant);
        console.log('- tenant_users:', response.user.tenant_users);
        
        // If tenant_users exists, log the first one's tenant property
        if (response.user.tenant_users && response.user.tenant_users.length > 0) {
          console.log('- First tenant_user.tenant:', response.user.tenant_users[0].tenant);
        }
      }
      
      // Store auth tokens
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Process user data to ensure we have tenant info
      const userData = response.user;
      
      // Try to ensure we have tenant ID information
      if (userData) {
        // Store the user object
        localStorage.setItem('user', JSON.stringify(userData));
        
        // If we have tenant information, store it separately too
        let tenantId = null;
        
        if (userData.tenant_id) {
          tenantId = userData.tenant_id;
        } else if (userData.tenant) {
          tenantId = userData.tenant;
        } else if (userData.tenant_users && userData.tenant_users.length > 0) {
          tenantId = userData.tenant_users[0].tenant;
        }
        
        if (tenantId) {
          console.log('Storing tenant_id in localStorage:', tenantId);
          localStorage.setItem('tenant_id', tenantId);
          
          // Also store in sessionStorage for redundancy
          sessionStorage.setItem('tenant_id', tenantId);
          
          // Store as current_tenant object for compatibility
          const currentTenant = { id: tenantId, name: userData.tenant_name || 'Default Tenant' };
          sessionStorage.setItem('current_tenant', JSON.stringify(currentTenant));
        } else {
          console.warn('No tenant information found in user data');
          
          // Attempt to explicitly fetch user details including tenant_id
          try {
            console.log('Attempting to fetch user details directly...');
            const userDetailsResponse = await fetch(`http://localhost:8000/api/auth/me/`, {
              headers: {
                'Authorization': `Bearer ${response.token}`
              }
            });
            
            if (userDetailsResponse.ok) {
              const userDetailsData = await userDetailsResponse.json();
              console.log('User details response:', userDetailsData);
              
              if (userDetailsData.tenant_id) {
                console.log('Found tenant_id in user details:', userDetailsData.tenant_id);
                localStorage.setItem('tenant_id', userDetailsData.tenant_id);
                sessionStorage.setItem('tenant_id', userDetailsData.tenant_id);
              }
            } else {
              console.error('Failed to fetch user details:', userDetailsResponse.status);
            }
          } catch (error) {
            console.error('Error fetching user details:', error);
          }
        }
      }
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: '100vw',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'url(/bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: 2
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, sm: 4 },
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img 
              src="/ArazitCRM-logo.svg" 
              alt="Arazit CRM Logo" 
              style={{ height: 45 }} 
            />
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.85rem' }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mb: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Google />}
              sx={{ 
                mb: 1.5, 
                py: 1,
                fontSize: '0.85rem',
                color: '#5F6368',
                borderColor: '#DADCE0',
                '&:hover': {
                  borderColor: '#5F6368',
                  backgroundColor: 'rgba(95, 99, 104, 0.04)'
                }
              }}
            >
              Login with Google
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Microsoft />}
              sx={{ 
                py: 1,
                fontSize: '0.85rem',
                color: '#5F6368',
                borderColor: '#DADCE0',
                '&:hover': {
                  borderColor: '#5F6368',
                  backgroundColor: 'rgba(95, 99, 104, 0.04)'
                }
              }}
            >
              Login with Microsoft
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
            <Divider sx={{ flexGrow: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, fontSize: '0.8rem' }}>
              or login with
            </Typography>
            <Divider sx={{ flexGrow: 1 }} />
          </Box>
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
              Email ID <Box component="span" sx={{ color: 'error.main' }}>*</Box>
            </Typography>
            <TextField
              required
              fullWidth
              id="email"
              name="email"
              placeholder="Enter your work email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#ffffff',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9d277c',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#9d277c',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#9e9e9e',
                  opacity: 1,
                },
              }}
              size="small"
              InputProps={{
                style: { fontSize: '0.9rem', color: '#424242' }
              }}
            />
            
            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
              Password <Box component="span" sx={{ color: 'error.main' }}>*</Box>
            </Typography>
            <TextField
              required
              fullWidth
              name="password"
              placeholder="Enter password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              sx={{ 
                mb: 0.5,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#ffffff',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9d277c',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#9d277c',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#9e9e9e',
                  opacity: 1,
                },
              }}
              size="small"
              InputProps={{
                style: { fontSize: '0.9rem', color: '#424242' },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <MuiLink 
                component={Link} 
                to="/forgot-password" 
                underline="none" 
                color="primary" 
                variant="body2"
                sx={{ fontWeight: 500, fontSize: '0.75rem' }}
              >
                Forgot Password?
              </MuiLink>
            </Box>
            
            {/* Development testing link */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <MuiLink 
                component={Link} 
                to="/test-auth" 
                underline="none" 
                color="secondary" 
                variant="body2"
                sx={{ fontWeight: 500, fontSize: '0.75rem' }}
              >
                Test Auth Page
              </MuiLink>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{ 
                py: 1, 
                mb: 2,
                fontSize: '0.9rem',
                backgroundColor: '#9d277c',
                '&:hover': {
                  backgroundColor: '#85114e'
                }
              }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Don't have an account?{' '}
                <MuiLink 
                  component={Link} 
                  to="/register" 
                  underline="none" 
                  color="primary"
                  sx={{ fontWeight: 600 }}
                >
                  Sign up
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 