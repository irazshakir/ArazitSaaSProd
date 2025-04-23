import { useState } from 'react';
import { 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Box, 
  Alert, 
  Grid,
  InputAdornment,
  IconButton,
  Divider,
  Link as MuiLink,
  Container,
  MenuItem,
  FormControl,
  Select
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { Visibility, VisibilityOff, Google, Microsoft } from '@mui/icons-material';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    tenant_name: '',
    industry: '',
    role: 'admin' // Default role
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Map the industry values to match the backend choices
  const industries = [
    { value: 'hajj_umrah', label: 'Hajj and Umrah' },
    { value: 'travel_tourism', label: 'Travel and Tourism' },
    { value: 'immigration', label: 'Immigration Consultancy' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'ecommerce', label: 'Ecommerce' },
    { value: 'general', label: 'General' }
  ];

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

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.register({
        email: formData.email,
        password: formData.password,
        password2: formData.password2,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        tenant_name: formData.tenant_name,
        industry: formData.industry,
        role: formData.role
      });
      
      // Store token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      // More detailed error handling
      if (err.response) {
        if (err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError(JSON.stringify(err.response.data));
        }
      } else {
        setError('Registration failed. Please try again. ' + err.message);
      }
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
      <Container maxWidth="sm">
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
              Register using Google account
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
            <Divider sx={{ flexGrow: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, fontSize: '0.8rem' }}>
              or register with
            </Typography>
            <Divider sx={{ flexGrow: 1 }} />
          </Box>
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              {/* Company Information */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
                  Company Name <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                </Typography>
                <TextField
                  required
                  fullWidth
                  id="tenant_name"
                  name="tenant_name"
                  placeholder="Enter your company name"
                  value={formData.tenant_name}
                  onChange={handleChange}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                    },
                  }}
                  size="small"
                  InputProps={{
                    style: { fontSize: '0.9rem', color: '#424242' }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
                  Industry <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                </Typography>
                <FormControl 
                  fullWidth 
                  required
                  size="small"
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                    },
                  }}
                >
                  <Select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    displayEmpty
                    inputProps={{ 
                      'aria-label': 'Industry',
                      style: { fontSize: '0.9rem', color: '#424242' }
                    }}
                  >
                    <MenuItem disabled value="">
                      <span style={{ color: '#9e9e9e' }}>Select your industry</span>
                    </MenuItem>
                    {industries.map((industry) => (
                      <MenuItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Personal Information */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
                  First Name <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                </Typography>
                <TextField
                  required
                  fullWidth
                  id="first_name"
                  name="first_name"
                  placeholder="Enter your first name"
                  value={formData.first_name}
                  onChange={handleChange}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                    },
                  }}
                  size="small"
                  InputProps={{
                    style: { fontSize: '0.9rem', color: '#424242' }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
                  Last Name <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                </Typography>
                <TextField
                  required
                  fullWidth
                  id="last_name"
                  name="last_name"
                  placeholder="Enter your last name"
                  value={formData.last_name}
                  onChange={handleChange}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                    },
                  }}
                  size="small"
                  InputProps={{
                    style: { fontSize: '0.9rem', color: '#424242' }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
                  Email <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                </Typography>
                <TextField
                  required
                  fullWidth
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                    },
                  }}
                  size="small"
                  InputProps={{
                    style: { fontSize: '0.9rem', color: '#424242' }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
                  Phone Number
                </Typography>
                <TextField
                  fullWidth
                  id="phone_number"
                  name="phone_number"
                  placeholder="Enter your phone number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                    },
                  }}
                  size="small"
                  InputProps={{
                    style: { fontSize: '0.9rem', color: '#424242' }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
                  Password <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                </Typography>
                <TextField
                  required
                  fullWidth
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
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
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
                  Confirm Password <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                </Typography>
                <TextField
                  required
                  fullWidth
                  name="password2"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="password2"
                  placeholder="Confirm your password"
                  value={formData.password2}
                  onChange={handleChange}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                    },
                  }}
                  size="small"
                  InputProps={{
                    style: { fontSize: '0.9rem', color: '#424242' },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowConfirmPassword}
                          edge="end"
                          size="small"
                        >
                          {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{ 
                py: 1, 
                mt: 1,
                mb: 2,
                fontSize: '0.9rem',
                backgroundColor: '#9d277c',
                '&:hover': {
                  backgroundColor: '#85114e'
                }
              }}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Already have an account?{' '}
                <MuiLink 
                  component={Link} 
                  to="/login" 
                  underline="none" 
                  color="primary"
                  sx={{ fontWeight: 600 }}
                >
                  Login
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register; 