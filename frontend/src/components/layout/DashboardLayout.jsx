import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import { ensureAuthenticated } from '../../utils/auth';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    // Use our more robust auth check
    if (!ensureAuthenticated()) {
      // Log error instead of alert
      console.error("Authentication failed in DashboardLayout. Token missing.");
      navigate('/login');
      return;
    }
    
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Store it again to ensure it's valid JSON
        localStorage.setItem('user', JSON.stringify(parsedUser));
        
        // Add a visible confirmation
        console.log("Dashboard Layout - User authenticated:", parsedUser);
      } catch (error) {
        // JSON parse error - invalid user data
        console.error("Invalid user data in localStorage", error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
    } else {
      // No user found but token exists - try to populate user with minimal data
      localStorage.setItem('user', JSON.stringify({ 
        email: 'unknown@example.com',
        industry: 'hajj_umrah' // Default to hajj_umrah to allow access
      }));
      
      console.log("Warning: User data was missing but token exists. Created minimal user.");
      navigate('/dashboard'); // Refresh to load the new user data
      return;
    }
    
    setIsAuthChecked(true);
  }, [navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Show loading until auth is checked and user is loaded
  if (!isAuthChecked || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Header */}
      <Header 
        mobileOpen={mobileOpen} 
        handleDrawerToggle={handleDrawerToggle} 
        user={user} 
      />
      
      {/* Sidebar */}
      <Sidebar 
        mobileOpen={mobileOpen} 
        handleDrawerToggle={handleDrawerToggle}
        user={user}
      />
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          backgroundColor: '#f5f7fa',
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout; 