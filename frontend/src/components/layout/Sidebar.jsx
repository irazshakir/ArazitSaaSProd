import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  Collapse
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  BarChart as AnalyticsIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  ExpandLess,
  ExpandMore,
  Assignment as AssignmentIcon,
  DirectionsCar as CarIcon,
  School as SchoolIcon,
  Public as PublicIcon,
  Facebook as FacebookIcon,
  WhatsApp as WhatsAppIcon,
  Description as TemplateIcon,
  Send as SendIcon,
  Luggage as LuggageIcon,
  Mosque as MosqueIcon,
  Hotel as HotelIcon,
  LocalAirport as VisaIcon,
  LocationCity as ZiyaratIcon,
  Groups as GroupsIcon,
  AccountTree as BranchIcon,
  Category as DepartmentIcon,
  CalendarToday as CalendarTodayIcon,
  Group as GroupIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountIcon,
  Message as MessageIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle, user, userRole }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Get user from localStorage if not passed as prop
  const [localUser, setLocalUser] = useState(null);
  const [openMenus, setOpenMenus] = useState({
    analytics: false,
    settings: false,
    hajjUmrah: false,
    immigration: false,
    travelTourism: false,
    realEstate: false
  });

  useEffect(() => {
    // If user prop is provided, use it
    if (user) {
      setLocalUser(user);
    } else {
      // Otherwise try to get from localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        
        // If industry is not in user data, try to get it from localStorage
        if (!parsedUser.industry) {
          const storedIndustry = localStorage.getItem('user_industry');
          if (storedIndustry) {
            parsedUser.industry = storedIndustry;
          }
        }
        
        setLocalUser(parsedUser);
      }
    }
  }, [user]);

  // Define role-based menu access
  const isAdmin = userRole === 'admin';
  const isStandardUser = ['department_head', 'manager', 'team_lead', 'sales_agent', 'support_agent', 'processor'].includes(userRole);

  // Get industry from user data or localStorage
  const userIndustry = localUser?.industry || localStorage.getItem('user_industry');

  // Determine if industry-specific menus should be shown
  const showHajjUmrahMenu = userIndustry === 'hajj_umrah';
  const showImmigrationMenu = userIndustry === 'immigration';
  const showTravelTourismMenu = userIndustry === 'travel_tourism';
  const showRealEstateMenu = userIndustry === 'real_estate';
  const showGeneralMenu = userIndustry === 'general';

  // Now define showIndustryMenus AFTER its dependent variables are declared
  const showIndustryMenus = isAdmin && (showHajjUmrahMenu || showImmigrationMenu || showTravelTourismMenu || showRealEstateMenu || showGeneralMenu);

  const handleMenuToggle = (menu) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  // Core menu items - available to all authenticated users
  const coreMenuItems = [
    ...(isAdmin ? [{ text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' }] : []),
    { text: 'Chats', icon: <ChatIcon />, path: '/dashboard/chats' },
    { text: 'Leads', icon: <PersonIcon />, path: '/dashboard/leads' },
  ];

  // Analytics submenu - available only to admin
  const analyticsMenuItems = [
    { text: 'Reports', icon: <AnalyticsIcon />, path: '/dashboard/analytics/analytical-report' },
  ];

  // Social submenu - only for admin
  /*
  const socialMenuItems = [
    { text: 'Templates', icon: <TemplateIcon />, path: '/templates' },
    { text: 'Bulk Messages', icon: <SendIcon />, path: '/dashboard/social/bulk-messages' },
  ];
  */

  // Accounts menu items - available to all users
  const accountsMenuItems = [
    { text: 'Invoices', icon: <ReceiptIcon />, path: '/dashboard/invoices' },
  ];

  // Settings submenu - only for admin
  const settingsMenuItems = [
    { text: 'WABA', icon: <WhatsAppIcon />, path: '/dashboard/settings/waba' },
    { text: 'Facebook Lead Forms', icon: <FacebookIcon />, path: '/dashboard/settings/facebook' },
    { text: 'Company', icon: <BusinessIcon />, path: '/dashboard/settings/company' },
    { text: 'Branches', icon: <BranchIcon />, path: '/dashboard/branches' },
    { text: 'Departments', icon: <DepartmentIcon />, path: '/dashboard/departments' },
    { text: 'Users', icon: <PeopleIcon />, path: '/dashboard/users' },
    { text: 'Teams', icon: <GroupsIcon />, path: '/dashboard/teams' },
    { text: 'Canned Messages', icon: <MessageIcon />, path: '/dashboard/canned-messages' },
    ...(userIndustry === 'immigration' || userIndustry === 'real_estate' ? [
      { text: 'Location Routing', icon: <LocationIcon />, path: '/dashboard/location-routing' }
    ] : [])
  ];

  // Hajj and Umrah specific menu items
  const hajjUmrahMenuItems = [
    { text: 'Hajj Packages', icon: <MosqueIcon />, path: '/dashboard/hajj-umrah/hajj-packages' },
    { text: 'Readymade Umrah', icon: <LuggageIcon />, path: '/dashboard/hajj-umrah/umrah-packages' },
    // Comment out unused menu items
    // { text: 'Custom Umrah', icon: <MosqueIcon />, path: '/dashboard/hajj-umrah/custom-umrah' },
    // { text: 'Transports', icon: <CarIcon />, path: '/dashboard/hajj-umrah/transports' },
    // { text: 'Visas', icon: <VisaIcon />, path: '/dashboard/hajj-umrah/visas' },
    // { text: 'Ziyarat', icon: <ZiyaratIcon />, path: '/dashboard/hajj-umrah/ziyarat' },
    // { text: 'Hotel Rates', icon: <HotelIcon />, path: '/dashboard/hajj-umrah/hotel-rates' },
    // { text: 'Flights', icon: <VisaIcon />, path: '/dashboard/hajj-umrah/flights' },
  ];

  // Immigration specific menu items
  const immigrationMenuItems = [
    { text: 'Countries', icon: <PublicIcon />, path: '/dashboard/immigration/countries' },
    { text: 'Universities', icon: <SchoolIcon />, path: '/dashboard/immigration/universities' },
  ];

  // Travel & Tourism specific menu items
  const travelTourismMenuItems = [
    { text: 'Travel Packages', icon: <LuggageIcon />, path: '/dashboard/travel/travel-packages' },
  ];

  // Real Estate specific menu items
  const realEstateMenuItems = [
    { text: 'Development Projects', icon: <BusinessIcon />, path: '/dashboard/real-estate/development-projects' },
  ];

  // General Products menu items
  const generalProductsMenuItems = [
    { text: 'Products', icon: <CategoryIcon />, path: '/dashboard/general-products' },
  ];

  const renderMenuItems = (items) => {
    return items.map((item) => (
      <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton 
          onClick={() => navigate(item.path)}
          sx={{ 
            borderRadius: 1,
            pl: item.indent ? 4 : 2,
            '&:hover': {
              backgroundColor: 'rgba(157, 39, 124, 0.08)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(157, 39, 124, 0.16)',
              '&:hover': {
                backgroundColor: 'rgba(157, 39, 124, 0.24)',
              },
            },
          }}
          selected={location.pathname === item.path}
        >
          <ListItemIcon sx={{ 
            minWidth: 40,
            color: location.pathname === item.path ? '#9d277c' : 'inherit'
          }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.text} 
            primaryTypographyProps={{ 
              fontSize: '0.8rem',
              fontWeight: location.pathname === item.path ? 600 : 400,
              color: location.pathname === item.path ? '#9d277c' : 'inherit'
            }}
          />
        </ListItemButton>
      </ListItem>
    ));
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/BluSkyLogo.png" 
            alt="BluSky Logo" 
            style={{ height: 40, marginRight: 8 }} 
          />
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1 }}>
        {/* Core Menu Items */}
        {renderMenuItems(coreMenuItems)}

        {/* Analytics Menu - Only visible to admin */}
        {isAdmin && (
          <>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => handleMenuToggle('analytics')}
                sx={{ 
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(157, 39, 124, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AnalyticsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Analytics" 
                  primaryTypographyProps={{ 
                    fontSize: '0.8rem',
                    fontWeight: 500
                  }}
                />
                {openMenus.analytics ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={openMenus.analytics} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {analyticsMenuItems.map((item) => (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton 
                      onClick={() => {
                        navigate(item.path);
                      }}
                      sx={{ 
                        borderRadius: 1,
                        pl: 4,
                        '&:hover': {
                          backgroundColor: 'rgba(157, 39, 124, 0.08)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(157, 39, 124, 0.16)',
                          '&:hover': {
                            backgroundColor: 'rgba(157, 39, 124, 0.24)',
                          },
                        },
                      }}
                      selected={location.pathname === item.path}
                    >
                      <ListItemIcon sx={{ 
                        minWidth: 40,
                        color: location.pathname === item.path ? '#9d277c' : 'inherit'
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        primaryTypographyProps={{ 
                          fontSize: '0.8rem',
                          fontWeight: location.pathname === item.path ? 600 : 400,
                          color: location.pathname === item.path ? '#9d277c' : 'inherit'
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* Accounts Section - Available to all users */}
        <ListItem sx={{ pt: 2, pb: 1 }}>
          <Typography 
            variant="overline" 
            color="text.secondary"
            sx={{ 
              fontSize: '0.7rem', 
              fontWeight: 600,
              letterSpacing: '0.08em'
            }}
          >
            ACCOUNTS
          </Typography>
        </ListItem>
        {renderMenuItems(accountsMenuItems)}

        {/* Event Reminder Section - Only visible to admin */}
        {isAdmin && (
          <>
            <ListItem sx={{ pt: 2, pb: 1 }}>
              <Typography 
                variant="overline" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 600,
                  letterSpacing: '0.08em'
                }}
              >
                EVENT REMINDER
              </Typography>
            </ListItem>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => navigate('/dashboard/reminders/events')}
                sx={{ 
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(157, 39, 124, 0.08)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(157, 39, 124, 0.16)',
                    '&:hover': {
                      backgroundColor: 'rgba(157, 39, 124, 0.24)',
                    },
                  },
                }}
                selected={location.pathname === '/dashboard/reminders/events'}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: location.pathname === '/dashboard/reminders/events' ? '#9d277c' : 'inherit'
                }}>
                  <CalendarTodayIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Events" 
                  primaryTypographyProps={{ 
                    fontSize: '0.8rem',
                    fontWeight: location.pathname === '/dashboard/reminders/events' ? 600 : 400,
                    color: location.pathname === '/dashboard/reminders/events' ? '#9d277c' : 'inherit'
                  }}
                />
              </ListItemButton>
            </ListItem>
          </>
        )}

        {/* Settings Section - Admin only */}
        {isAdmin && (
          <>
            <ListItem sx={{ pt: 2, pb: 1 }}>
              <Typography 
                variant="overline" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 600,
                  letterSpacing: '0.08em'
                }}
              >
                SETTINGS
              </Typography>
            </ListItem>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => handleMenuToggle('settings')}
                sx={{ 
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(157, 39, 124, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="General Settings" 
                  primaryTypographyProps={{ 
                    fontSize: '0.8rem',
                    fontWeight: 500
                  }}
                />
                {openMenus.settings ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={openMenus.settings} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {settingsMenuItems.map((item) => (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton 
                      onClick={() => navigate(item.path)}
                      sx={{ 
                        borderRadius: 1,
                        pl: 4,
                        '&:hover': {
                          backgroundColor: 'rgba(157, 39, 124, 0.08)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(157, 39, 124, 0.16)',
                          '&:hover': {
                            backgroundColor: 'rgba(157, 39, 124, 0.24)',
                          },
                        },
                      }}
                      selected={location.pathname === item.path}
                    >
                      <ListItemIcon sx={{ 
                        minWidth: 40,
                        color: location.pathname === item.path ? '#9d277c' : 'inherit'
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        primaryTypographyProps={{ 
                          fontSize: '0.8rem',
                          fontWeight: location.pathname === item.path ? 600 : 400,
                          color: location.pathname === item.path ? '#9d277c' : 'inherit'
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* Hajj and Umrah Settings - Admin only */}
        {isAdmin && showHajjUmrahMenu && (
          <>
            <ListItem sx={{ pt: 2, pb: 1 }}>
              <Typography 
                variant="overline" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 600,
                  letterSpacing: '0.08em'
                }}
              >
                HAJJ & UMRAH SETTINGS
              </Typography>
            </ListItem>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => handleMenuToggle('hajjUmrah')}
                sx={{ 
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(157, 39, 124, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <MosqueIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Hajj & Umrah" 
                  primaryTypographyProps={{ 
                    fontSize: '0.8rem',
                    fontWeight: 500
                  }}
                />
                {openMenus.hajjUmrah ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={openMenus.hajjUmrah} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {hajjUmrahMenuItems.map((item) => (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton 
                      onClick={() => navigate(item.path)}
                      sx={{ 
                        borderRadius: 1,
                        pl: 4,
                        '&:hover': {
                          backgroundColor: 'rgba(157, 39, 124, 0.08)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(157, 39, 124, 0.16)',
                          '&:hover': {
                            backgroundColor: 'rgba(157, 39, 124, 0.24)',
                          },
                        },
                      }}
                      selected={location.pathname === item.path}
                    >
                      <ListItemIcon sx={{ 
                        minWidth: 40,
                        color: location.pathname === item.path ? '#9d277c' : 'inherit'
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        primaryTypographyProps={{ 
                          fontSize: '0.8rem',
                          fontWeight: location.pathname === item.path ? 600 : 400,
                          color: location.pathname === item.path ? '#9d277c' : 'inherit'
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* Immigration Settings - Admin only */}
        
        {isAdmin && showImmigrationMenu && (
          <>
            <ListItem sx={{ pt: 2, pb: 1 }}>
              <Typography 
                variant="overline" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 600,
                  letterSpacing: '0.08em'
                }}
              >
                IMMIGRATION SETTINGS
              </Typography>
            </ListItem>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => handleMenuToggle('immigration')}
                sx={{ 
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(157, 39, 124, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <PublicIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Immigration" 
                  primaryTypographyProps={{ 
                    fontSize: '0.8rem',
                    fontWeight: 500
                  }}
                />
                {openMenus.immigration ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={openMenus.immigration} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {immigrationMenuItems.map((item) => (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton 
                      onClick={() => navigate(item.path)}
                      sx={{ 
                        borderRadius: 1,
                        pl: 4,
                        '&:hover': {
                          backgroundColor: 'rgba(157, 39, 124, 0.08)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(157, 39, 124, 0.16)',
                          '&:hover': {
                            backgroundColor: 'rgba(157, 39, 124, 0.24)',
                          },
                        },
                      }}
                      selected={location.pathname === item.path}
                    >
                      <ListItemIcon sx={{ 
                        minWidth: 40,
                        color: location.pathname === item.path ? '#9d277c' : 'inherit'
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        primaryTypographyProps={{ 
                          fontSize: '0.8rem',
                          fontWeight: location.pathname === item.path ? 600 : 400,
                          color: location.pathname === item.path ? '#9d277c' : 'inherit'
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}
       

        {/* Travel & Tourism Settings - Admin only */}
        {isAdmin && showTravelTourismMenu && (
          <>
            <ListItem sx={{ pt: 2, pb: 1 }}>
              <Typography 
                variant="overline" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 600,
                  letterSpacing: '0.08em'
                }}
              >
                TRAVEL & TOURISM
              </Typography>
            </ListItem>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => handleMenuToggle('travelTourism')}
                sx={{ 
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(157, 39, 124, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LuggageIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Travel & Tourism" 
                  primaryTypographyProps={{ 
                    fontSize: '0.8rem',
                    fontWeight: 500
                  }}
                />
                {openMenus.travelTourism ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={openMenus.travelTourism} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {travelTourismMenuItems.map((item) => (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton 
                      onClick={() => navigate(item.path)}
                      sx={{ 
                        borderRadius: 1,
                        pl: 4,
                        '&:hover': {
                          backgroundColor: 'rgba(157, 39, 124, 0.08)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(157, 39, 124, 0.16)',
                          '&:hover': {
                            backgroundColor: 'rgba(157, 39, 124, 0.24)',
                          },
                        },
                      }}
                      selected={location.pathname === item.path}
                    >
                      <ListItemIcon sx={{ 
                        minWidth: 40,
                        color: location.pathname === item.path ? '#9d277c' : 'inherit'
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        primaryTypographyProps={{ 
                          fontSize: '0.8rem',
                          fontWeight: location.pathname === item.path ? 600 : 400,
                          color: location.pathname === item.path ? '#9d277c' : 'inherit'
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* Real Estate Settings - Admin only */}
        {isAdmin && showRealEstateMenu && (
          <>
            <ListItem sx={{ pt: 2, pb: 1 }}>
              <Typography 
                variant="overline" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 600,
                  letterSpacing: '0.08em'
                }}
              >
                REAL ESTATE
              </Typography>
            </ListItem>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => handleMenuToggle('realEstate')}
                sx={{ 
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(157, 39, 124, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Real Estate" 
                  primaryTypographyProps={{ 
                    fontSize: '0.8rem',
                    fontWeight: 500
                  }}
                />
                {openMenus.realEstate ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={openMenus.realEstate} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {realEstateMenuItems.map((item) => (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton 
                      onClick={() => navigate(item.path)}
                      sx={{ 
                        borderRadius: 1,
                        pl: 4,
                        '&:hover': {
                          backgroundColor: 'rgba(157, 39, 124, 0.08)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(157, 39, 124, 0.16)',
                          '&:hover': {
                            backgroundColor: 'rgba(157, 39, 124, 0.24)',
                          },
                        },
                      }}
                      selected={location.pathname === item.path}
                    >
                      <ListItemIcon sx={{ 
                        minWidth: 40,
                        color: location.pathname === item.path ? '#9d277c' : 'inherit'
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        primaryTypographyProps={{ 
                          fontSize: '0.8rem',
                          fontWeight: location.pathname === item.path ? 600 : 400,
                          color: location.pathname === item.path ? '#9d277c' : 'inherit'
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* General Products Settings - Admin only */}
        {isAdmin && showGeneralMenu && (
          <>
            <ListItem sx={{ pt: 2, pb: 1 }}>
              <Typography 
                variant="overline" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 600,
                  letterSpacing: '0.08em'
                }}
              >
                GENERAL PRODUCTS
              </Typography>
            </ListItem>
            <List component="div" disablePadding>
              {generalProductsMenuItems.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton 
                    onClick={() => navigate(item.path)}
                    sx={{ 
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(157, 39, 124, 0.08)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(157, 39, 124, 0.16)',
                        '&:hover': {
                          backgroundColor: 'rgba(157, 39, 124, 0.24)',
                        },
                      },
                    }}
                    selected={location.pathname === item.path}
                  >
                    <ListItemIcon sx={{ 
                      minWidth: 40,
                      color: location.pathname === item.path ? '#9d277c' : 'inherit'
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ 
                        fontSize: '0.8rem',
                        fontWeight: location.pathname === item.path ? 600 : 400,
                        color: location.pathname === item.path ? '#9d277c' : 'inherit'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </List>
      <Divider sx={{ mt: 2 }} />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          © {new Date().getFullYear()} Arazit CRM
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          All rights reserved
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            border: 'none'
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar; 