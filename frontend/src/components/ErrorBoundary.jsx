import React from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error("Error caught by error boundary:", error, errorInfo);
    this.setState({ errorInfo });
    
    // Also log to localStorage for debugging
    try {
      const errorLog = {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        time: new Date().toISOString()
      };
      
      // Store in localStorage for debugging
      localStorage.setItem('lastError', JSON.stringify(errorLog));
      
      // Optional: alert for visibility
      alert(`Error caught: ${error.toString()}\n\nSee details in console and localStorage.`);
    } catch (e) {
      // In case localStorage fails
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} />;
    }

    return this.props.children;
  }
}

// Separate component for the error UI
const ErrorFallback = ({ error, errorInfo }) => {
  const navigate = useNavigate();
  
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" color="error" gutterBottom>
          Something went wrong
        </Typography>
        
        <Typography variant="body1" paragraph>
          An error occurred while rendering this page. The details have been logged to the console.
        </Typography>
        
        <Box sx={{ my: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Error details:
          </Typography>
          <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '200px' }}>
            {error?.toString()}
          </Typography>
          
          {errorInfo && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Component stack:
              </Typography>
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '200px' }}>
                {errorInfo.componentStack}
              </Typography>
            </>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/')}
          >
            Go to Dashboard
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => navigate('/test-auth')}
          >
            Check Authentication
          </Button>
          
          <Button 
            variant="outlined" 
            color="error" 
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
          >
            Logout & Clear Data
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ErrorBoundary; 