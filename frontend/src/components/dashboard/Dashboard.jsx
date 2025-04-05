import { useState, useEffect } from 'react';
import { 
  Typography, 
  Grid, 
  Box, 
  Card, 
  CardContent, 
  Avatar, 
  IconButton, 
  Divider,
  LinearProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  AttachMoney as AttachMoneyIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import analyticsService from '../../services/analyticsService';

// Initial empty state for dashboard data
const initialDashboardData = {
  stats: {
    newInquiries: 0,
    activeInquiries: 0,
    closeToSales: 0,
    sales: 0,
    overdue: 0
  },
  trends: {
    newInquiries: 0,
    activeInquiries: 0,
    closeToSales: 0,
    sales: 0,
    overdue: 0
  },
  salesVsInquiries: {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    sales: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    inquiries: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  leadStatuses: {
    new: 0,
    qualified: 0,
    nonPotential: 0,
    proposal: 0,
    negotiation: 0,
    won: 0,
    lost: 0
  },
  recentActivities: [],
  upcomingEvents: []
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(initialDashboardData);
  const navigate = useNavigate();

  // State for loading analytics data
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  
  useEffect(() => {
    // Get user from localStorage
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [navigate]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (isLoading || !user) return;
      
      setIsLoadingAnalytics(true);
      setAnalyticsError(null);
      
      try {
        // Get current month's date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        // Format dates for API
        const dateFrom = startOfMonth.toISOString().split('T')[0];
        const dateTo = endOfMonth.toISOString().split('T')[0];
        
        // Build filters for current month
        const filters = {
          date_from: dateFrom,
          date_to: dateTo
        };
        
        // Fetch analytics data
        const analyticsData = await analyticsService.getDashboardStats(filters);
        
        console.log('Analytics data received:', analyticsData);
        
        if (analyticsData) {
          setDashboardData(analyticsData);
        } else {
          console.error('No analytics data returned');
          setAnalyticsError('Failed to load analytics data');
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setAnalyticsError(error.message || 'Failed to load analytics data');
      } finally {
        setIsLoadingAnalytics(false);
      }
    };
    
    fetchDashboardData();
  }, [isLoading, user]);

  // Sales vs Inquiries chart options
  const salesInquiriesChartOptions = {
    chart: {
      id: 'sales-inquiries-chart',
      toolbar: {
        show: false
      },
      sparkline: {
        enabled: false
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    colors: ['#9d277c', '#c34387'],
    xaxis: {
      categories: dashboardData.salesVsInquiries.months,
      labels: {
        style: {
          colors: '#9e9e9e',
          fontSize: '10px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#9e9e9e',
          fontSize: '10px'
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px'
    },
    grid: {
      borderColor: '#f1f1f1',
      strokeDashArray: 4
    },
    tooltip: {
      theme: 'light'
    }
  };

  const salesInquiriesChartSeries = [
    {
      name: 'Sales',
      data: dashboardData.salesVsInquiries.sales
    },
    {
      name: 'Inquiries',
      data: dashboardData.salesVsInquiries.inquiries
    }
  ];

  // Lead Status distribution chart options
  const leadStatusChartOptions = {
    chart: {
      id: 'lead-status-chart',
      toolbar: {
        show: false
      }
    },
    labels: ['New', 'Qualified', 'Non-Potential', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    colors: ['#9d277c', '#c34387', '#f7a6f7', '#824c96', '#ad5cac', '#4caf50', '#f44336'],
    legend: {
      position: 'bottom',
      fontSize: '12px'
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      theme: 'light'
    }
  };

  const leadStatusChartSeries = [
    dashboardData.leadStatuses.new,
    dashboardData.leadStatuses.qualified,
    dashboardData.leadStatuses.nonPotential,
    dashboardData.leadStatuses.proposal,
    dashboardData.leadStatuses.negotiation,
    dashboardData.leadStatuses.won,
    dashboardData.leadStatuses.lost
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Please log in to view the dashboard
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Welcome back, {user?.first_name || user?.email?.split('@')[0]}!
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Here's what's happening with your {user?.tenant_name || 'organization'} this month.
        </Typography>
        
        {/* Show loading indicator or error message */}
        {isLoadingAnalytics && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress color="secondary" />
          </Box>
        )}
        
        {analyticsError && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(244, 67, 54, 0.1)', borderRadius: 1 }}>
            <Typography color="error" variant="body2">
              {analyticsError}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2,
              height: '100%',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(157, 39, 124, 0.1)', color: '#9d277c' }}>
                  <PeopleIcon />
                </Avatar>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                {dashboardData.stats.newInquiries}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New Inquiries
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  +{dashboardData.trends.newInquiries}% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2,
              height: '100%',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(195, 67, 135, 0.1)', color: '#c34387' }}>
                  <BusinessIcon />
                </Avatar>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                {dashboardData.stats.activeInquiries}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Inquiries
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  +{dashboardData.trends.activeInquiries}% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2,
              height: '100%',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(247, 166, 247, 0.1)', color: '#f7a6f7' }}>
                  <AttachMoneyIcon />
                </Avatar>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                {dashboardData.stats.closeToSales}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Close to Sales
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  +{dashboardData.trends.closeToSales}% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2,
              height: '100%',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(157, 39, 124, 0.1)', color: '#9d277c' }}>
                  <AssignmentIcon />
                </Avatar>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                {dashboardData.stats.sales}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sales
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  +{dashboardData.trends.sales}% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2,
              height: '100%',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255, 82, 82, 0.1)', color: '#ff5252' }}>
                  <ScheduleIcon />
                </Avatar>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                {dashboardData.stats.overdue}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overdue
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingDownIcon sx={{ color: 'error.main', fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption" color="error.main">
                  +{dashboardData.trends.overdue}% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Sales vs Inquiries
                </Typography>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Chart
                options={salesInquiriesChartOptions}
                series={salesInquiriesChartSeries}
                type="line"
                height={350}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Lead Status Distribution
                </Typography>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Chart
                options={leadStatusChartOptions}
                series={leadStatusChartSeries}
                type="pie"
                height={300}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activities and Upcoming Events */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Activities
                </Typography>
                <Button 
                  size="small" 
                  endIcon={<AddIcon />}
                  sx={{ 
                    color: '#9d277c',
                    '&:hover': {
                      backgroundColor: 'rgba(157, 39, 124, 0.08)'
                    }
                  }}
                >
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {dashboardData.recentActivities && dashboardData.recentActivities.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {dashboardData.recentActivities.map((activity) => (
                    <ListItem 
                      key={activity.id} 
                      alignItems="flex-start"
                      sx={{ 
                        px: 0, 
                        py: 1.5,
                        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                        '&:last-child': {
                          borderBottom: 'none'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={activity.avatar}>
                          {activity.user.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {activity.user} <span style={{ fontWeight: 400 }}>{activity.action}</span>
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Chip
                              label={activity.status}
                              size="small"
                              sx={{ 
                                height: 20,
                                fontSize: '0.7rem',
                                mr: 1,
                                backgroundColor: 
                                  activity.status === 'success' ? 'rgba(76, 175, 80, 0.1)' : 
                                  activity.status === 'warning' ? 'rgba(255, 152, 0, 0.1)' : 
                                  'rgba(33, 150, 243, 0.1)',
                                color: 
                                  activity.status === 'success' ? 'success.main' : 
                                  activity.status === 'warning' ? 'warning.main' : 
                                  'info.main'
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <ScheduleIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />
                              {activity.time}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent activities
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Upcoming Events
                </Typography>
                <Button 
                  size="small" 
                  endIcon={<AddIcon />}
                  sx={{ 
                    color: '#9d277c',
                    '&:hover': {
                      backgroundColor: 'rgba(157, 39, 124, 0.08)'
                    }
                  }}
                >
                  Add Event
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {dashboardData.upcomingEvents && dashboardData.upcomingEvents.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {dashboardData.upcomingEvents.map((event) => (
                    <ListItem 
                      key={event.id} 
                      alignItems="flex-start"
                      sx={{ 
                        px: 0, 
                        py: 1.5,
                        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                        '&:last-child': {
                          borderBottom: 'none'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'rgba(157, 39, 124, 0.1)', color: '#9d277c' }}>
                          <CalendarTodayIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {event.title}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <ScheduleIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />
                              {event.date}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <BusinessIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />
                              {event.location}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No upcoming events
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 