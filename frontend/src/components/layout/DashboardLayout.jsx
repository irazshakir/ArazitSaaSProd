import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import { ensureAuthenticated, getUserRole } from '../../utils/auth';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    if (!ensureAuthenticated()) {
      console.error("Authentication failed in DashboardLayout. Token missing.");
      navigate('/login');
      return;
    }
    
    // Get user and role from localStorage
    const storedUser = localStorage.getItem('user');
    const storedRole = getUserRole() || 'processor'; // Default to processor if no role is found
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // If userRole is not in localStorage but is in the user object, use that
        const effectiveRole = storedRole || parsedUser.role || 'processor';
        setUserRole(effectiveRole);
        
        // Store role in localStorage if it came from the user object
        if (!storedRole && parsedUser.role) {
          localStorage.setItem('user_role', parsedUser.role);
        }
        
        console.log("Dashboard Layout - User authenticated:", {
          user: parsedUser,
          role: effectiveRole
        });
      } catch (error) {
        console.error("Invalid user data in localStorage", error);
        navigate('/login');
        return;
      }
    } else {
      navigate('/login');
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
        userRole={userRole}
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