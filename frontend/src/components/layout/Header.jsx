import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  ListItemIcon,
  Tooltip,
  Divider,
  Card,
  CardContent,
  Slide,
  Snackbar
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Mail as MailIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { authService } from '../../services/api';
import NotificationCenter from '../universalComponents/NotificationCenter';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { message } from 'antd';

dayjs.extend(relativeTime);

const drawerWidth = 240;

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const Header = ({ mobileOpen, handleDrawerToggle, user }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [messagesAnchorEl, setMessagesAnchorEl] = useState(null);
  const [popupNotification, setPopupNotification] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [notificationSound] = useState(new Audio('/notification-bell.mp3'));
  const notificationRef = useRef(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsMenuOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleMessagesMenuOpen = (event) => {
    setMessagesAnchorEl(event.currentTarget);
  };

  const handleMessagesMenuClose = () => {
    setMessagesAnchorEl(null);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleNotificationClick = (notification) => {
    console.log('Header received notification click:', notification);
    
    // Close any open menus
    handleNotificationsMenuClose();
    setPopupNotification(null);
    
    // Safety check for notification
    if (!notification) {
      console.error('Notification object is null or undefined');
      return;
    }
    
    // Handle navigation based on notification type
    try {
      switch (notification.notification_type) {
        case 'lead_assigned':
        case 'lead_overdue':
          if (notification.lead && notification.lead.id) {
            console.log(`Navigating to lead: ${notification.lead.id}`);
            navigate(`/dashboard/leads/${notification.lead.id}`);
          } else {
            console.error('Lead ID not found in notification:', notification);
            message.error('Could not navigate to lead: missing ID');
          }
          break;
          
        case 'activity_reminder':
          if (notification.lead_activity && notification.lead_activity.lead && notification.lead_activity.lead.id) {
            console.log(`Navigating to lead activity: ${notification.lead_activity.lead.id}`);
            navigate(`/dashboard/leads/${notification.lead_activity.lead.id}`);
          } else {
            console.error('Lead activity or lead ID not found in notification:', notification);
            message.error('Could not navigate to activity: missing lead ID');
          }
          break;
          
        case 'lead_transferred':
          if (notification.lead && notification.lead.id) {
            console.log(`Navigating to transferred lead: ${notification.lead.id}`);
            navigate(`/dashboard/leads/${notification.lead.id}`);
          } else {
            console.error('Lead ID not found in transferred notification:', notification);
            message.error('Could not navigate to transferred lead: missing ID');
          }
          break;
          
        default:
          console.log(`Unknown notification type: ${notification.notification_type}`);
          break;
      }
    } catch (error) {
      console.error('Error handling notification navigation:', error);
      message.error('Failed to navigate to the appropriate page');
    }
  };

  const handleNewNotification = (notification) => {
    console.log('New notification received:', notification);
    
    // Play notification sound
    notificationSound.play().catch(error => console.error('Error playing sound:', error));
    
    // Show popup notification
    setPopupNotification(notification);
    setShowPopup(true);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setPopupNotification(null);
      setShowPopup(false);
    }, 5000);
  };

  // Function to handle popup close
  const handlePopupClose = () => {
    setShowPopup(false);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        backgroundColor: '#f5f7fa',
        color: 'text.primary',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' }, px: 2 }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Messages">
            <IconButton 
              color="inherit" 
              onClick={handleMessagesMenuOpen}
              size="large"
            >
              <Badge badgeContent={4} color="error">
                <MailIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <NotificationCenter 
            onNewNotification={handleNewNotification} 
            onClick={handleNotificationClick}
          />
          
          <Tooltip title="Account">
            <IconButton
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
              sx={{ ml: 1 }}
            >
              <Avatar 
                alt={user?.first_name || user?.email || 'User'} 
                src={user?.profile_picture || ''}
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: '#9d277c'
                }}
              >
                {(user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
      
      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            width: 220,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {user?.email || ''}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => navigate('/dashboard/profile')}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => navigate('/dashboard/help')}>
          <ListItemIcon>
            <HelpIcon fontSize="small" />
          </ListItemIcon>
          Help Center
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      
      {/* Messages Menu */}
      <Menu
        anchorEl={messagesAnchorEl}
        id="messages-menu"
        open={Boolean(messagesAnchorEl)}
        onClose={handleMessagesMenuClose}
        onClick={handleMessagesMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            width: 320,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Messages
          </Typography>
        </Box>
        <Divider />
        <MenuItem>
          <Box sx={{ py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              John Doe
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Hey, how's it going?
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box sx={{ py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Jane Smith
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Can we schedule a meeting?
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box sx={{ py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Mike Johnson
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              I've sent you the files
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Typography 
            variant="body2" 
            color="primary" 
            sx={{ 
              cursor: 'pointer', 
              fontWeight: 500,
              '&:hover': { textDecoration: 'underline' }
            }}
            onClick={() => navigate('/dashboard/email')}
          >
            View all messages
          </Typography>
        </Box>
      </Menu>
      
      {/* Popup Notification */}
      <Snackbar
        open={!!popupNotification && showPopup}
        autoHideDuration={6000}
        onClose={handlePopupClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={Slide}
      >
        <Card 
          sx={{ 
            minWidth: 300,
            maxWidth: 400,
            backgroundColor: '#fff',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px'
          }}
          onClick={() => handleNotificationClick(popupNotification)}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {popupNotification?.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {popupNotification?.message}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {dayjs(popupNotification?.created_at).fromNow()}
                </Typography>
              </Box>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePopupClose();
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      </Snackbar>
    </AppBar>
  );
};

export default Header; 