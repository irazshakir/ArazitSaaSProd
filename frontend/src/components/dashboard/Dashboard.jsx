import { useState, useEffect } from 'react';
import { 
  Typography, 
  Grid, 
  Paper, 
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

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
          setUser(JSON.parse(storedUser));
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

  // Sample data for charts
  const salesChartOptions = {
    chart: {
      id: 'sales-chart',
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
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
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

  const salesChartSeries = [
    {
      name: 'Sales',
      data: [30, 40, 35, 50, 49, 60, 70, 91, 125]
    },
    {
      name: 'Revenue',
      data: [20, 35, 40, 45, 55, 57, 65, 85, 110]
    }
  ];

  const userChartOptions = {
    chart: {
      id: 'user-chart',
      toolbar: {
        show: false
      }
    },
    labels: ['Active', 'Inactive', 'New'],
    colors: ['#9d277c', '#c34387', '#f7a6f7'],
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

  const userChartSeries = [63, 25, 12];

  // Sample data for recent activities
  const recentActivities = [
    {
      id: 1,
      user: 'John Doe',
      action: 'added a new client',
      time: '2 hours ago',
      avatar: '/avatar1.jpg',
      status: 'success'
    },
    {
      id: 2,
      user: 'Jane Smith',
      action: 'completed a task',
      time: '4 hours ago',
      avatar: '/avatar2.jpg',
      status: 'success'
    },
    {
      id: 3,
      user: 'Mike Johnson',
      action: 'updated a project',
      time: '6 hours ago',
      avatar: '/avatar3.jpg',
      status: 'warning'
    },
    {
      id: 4,
      user: 'Sarah Williams',
      action: 'scheduled a meeting',
      time: '8 hours ago',
      avatar: '/avatar4.jpg',
      status: 'info'
    }
  ];

  // Sample data for upcoming events
  const upcomingEvents = [
    {
      id: 1,
      title: 'Team Meeting',
      date: 'Today, 2:00 PM',
      location: 'Conference Room A'
    },
    {
      id: 2,
      title: 'Client Presentation',
      date: 'Tomorrow, 10:00 AM',
      location: 'Virtual Meeting'
    },
    {
      id: 3,
      title: 'Project Deadline',
      date: 'Oct 15, 2023',
      location: 'Project Management'
    }
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
          Welcome back, {user.first_name || user.email.split('@')[0]}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your {user.tenant_name || 'organization'} today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
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
                1
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  +0% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
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
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Departments
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingDownIcon sx={{ color: 'error.main', fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption" color="error.main">
                  0% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
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
                $0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Revenue
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  +0% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
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
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Projects
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  +0% from last month
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
                  Sales Overview
                </Typography>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Chart
                options={salesChartOptions}
                series={salesChartSeries}
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
                  User Distribution
                </Typography>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Chart
                options={userChartOptions}
                series={userChartSeries}
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
              <List sx={{ p: 0 }}>
                {recentActivities.map((activity) => (
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
              <List sx={{ p: 0 }}>
                {upcomingEvents.map((event) => (
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 