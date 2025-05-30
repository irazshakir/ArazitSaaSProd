import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const TestAuthPage = () => {
  const [localStorageContent, setLocalStorageContent] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // Collect all localStorage data
    const data = {
      token: localStorage.getItem('token'),
      refreshToken: localStorage.getItem('refreshToken'),
      user: localStorage.getItem('user'),
      accessToken: localStorage.getItem('access_token'),
      refreshTokenAlt: localStorage.getItem('refresh_token'),
    };
    
    setLocalStorageContent(data);
    
    // Replace alert with console log
    console.log("TestAuthPage - Auth Data:", data);
  }, []);

  const handleForceLogin = () => {
    // Force set some dummy auth data to test
    localStorage.setItem('token', 'test-token-' + Date.now());
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      email: 'test@example.com',
      industry: 'hajj_umrah'
    }));
    
    // Reload the page to show updated values
    window.location.reload();
  };

  const handleClearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Reload the page to show updated values
    window.location.reload();
  };

  const handleGoToHajjPackages = () => {
    navigate('/dashboard/hajj-umrah/hajj-packages');
  };

  return (
    <Container maxWidth="md" sx={{ pt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Authentication Test Page
        </Typography>
        
        <Typography variant="subtitle1" color="primary" sx={{ mb: 3 }}>
          This page is for debugging authentication issues
        </Typography>
        
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: localStorageContent.token ? 'success.light' : 'error.light',
            color: localStorageContent.token ? 'success.contrastText' : 'error.contrastText'
          }}
        >
          <Typography variant="h6">
            Authentication Status: {localStorageContent.token ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}
          </Typography>
          <Typography variant="body2">
            Token: {localStorageContent.token ? localStorageContent.token.substring(0, 15) + '...' : 'MISSING'}
          </Typography>
          <Typography variant="body2">
            User: {localStorageContent.user ? 'PRESENT' : 'MISSING'}
          </Typography>
        </Paper>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            LocalStorage Authentication Data:
          </Typography>
          
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
              {JSON.stringify(localStorageContent, null, 2)}
            </pre>
          </Paper>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            User Object (if available):
          </Typography>
          
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
              {localStorageContent.user 
                ? JSON.stringify(JSON.parse(localStorageContent.user), null, 2) 
                : "No user data found"}
            </pre>
          </Paper>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleForceLogin}
          >
            Force Set Test Token
          </Button>
          
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleGoToHajjPackages}
          >
            Try to Navigate to Hajj Packages
          </Button>
          
          <Button 
            variant="contained" 
            color="warning" 
            onClick={() => {
              // Force authentication and navigate directly
              localStorage.setItem('token', 'dev-token-' + Date.now());
              localStorage.setItem('user', JSON.stringify({
                id: 999,
                email: 'dev@example.com',
                industry: 'hajj_umrah'
              }));
              // Navigate directly to Hajj Packages, bypassing authentication checks
              window.location.href = '/dashboard/hajj-umrah/hajj-packages';
            }}
          >
            FORCE Navigate to Hajj Packages
          </Button>
          
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleClearAuth}
          >
            Clear All Auth Data
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default TestAuthPage; 