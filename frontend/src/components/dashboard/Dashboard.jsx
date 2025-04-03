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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
import { branchService, departmentService } from '../../services/api';

// Dummy data for dashboard - default view (all branches/departments)
const defaultDummyData = {
  stats: {
    newInquiries: 47,
    activeInquiries: 124,
    closeToSales: 18,
    sales: 32,
    overdue: 15
  },
  trends: {
    newInquiries: 12,
    activeInquiries: 8,
    closeToSales: 15,
    sales: 25,
    overdue: 5
  },
  salesVsInquiries: {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    sales: [10, 15, 12, 18, 22, 28, 30, 35, 32],
    inquiries: [45, 52, 38, 65, 74, 80, 95, 102, 112]
  },
  leadStatuses: {
    new: 35,
    qualified: 25,
    nonPotential: 12,
    proposal: 18,
    negotiation: 15,
    won: 32,
    lost: 22
  },
  recentActivities: [
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
  ],
  upcomingEvents: [
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
  ]
};

// Branch specific dummy data
const branchSpecificData = {
  "branch1": {
    stats: {
      newInquiries: 23,
      activeInquiries: 76,
      closeToSales: 8,
      sales: 15,
      overdue: 7
    },
    trends: {
      newInquiries: 18,
      activeInquiries: 5,
      closeToSales: 10,
      sales: 22,
      overdue: 3
    },
    salesVsInquiries: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      sales: [5, 7, 6, 12, 14, 15, 17, 19, 15],
      inquiries: [28, 32, 25, 40, 45, 48, 55, 62, 76]
    },
    leadStatuses: {
      new: 20,
      qualified: 15,
      nonPotential: 8,
      proposal: 10,
      negotiation: 8,
      won: 15,
      lost: 12
    }
  },
  "branch2": {
    stats: {
      newInquiries: 15,
      activeInquiries: 32,
      closeToSales: 6,
      sales: 12,
      overdue: 4
    },
    trends: {
      newInquiries: 8,
      activeInquiries: 12,
      closeToSales: 20,
      sales: 15,
      overdue: 2
    },
    salesVsInquiries: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      sales: [3, 5, 4, 4, 6, 8, 10, 11, 12],
      inquiries: [12, 15, 10, 18, 22, 25, 28, 30, 32]
    },
    leadStatuses: {
      new: 10,
      qualified: 8,
      nonPotential: 3,
      proposal: 5,
      negotiation: 4,
      won: 12,
      lost: 8
    }
  },
  "branch3": {
    stats: {
      newInquiries: 9,
      activeInquiries: 16,
      closeToSales: 4,
      sales: 5,
      overdue: 4
    },
    trends: {
      newInquiries: 5,
      activeInquiries: 10,
      closeToSales: 25,
      sales: 30,
      overdue: 8
    },
    salesVsInquiries: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      sales: [2, 3, 2, 2, 2, 5, 3, 5, 5],
      inquiries: [5, 5, 3, 7, 7, 7, 12, 10, 14]
    },
    leadStatuses: {
      new: 5,
      qualified: 2,
      nonPotential: 1,
      proposal: 3,
      negotiation: 3,
      won: 5,
      lost: 2
    }
  }
};

// Department specific dummy data
const departmentSpecificData = {
  "dept1": {
    stats: {
      newInquiries: 32,
      activeInquiries: 87,
      closeToSales: 12,
      sales: 22,
      overdue: 9
    },
    trends: {
      newInquiries: 15,
      activeInquiries: 9,
      closeToSales: 18,
      sales: 30,
      overdue: 4
    },
    salesVsInquiries: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      sales: [7, 10, 8, 12, 15, 18, 20, 24, 22],
      inquiries: [35, 40, 30, 50, 55, 60, 70, 75, 87]
    },
    leadStatuses: {
      new: 25,
      qualified: 18,
      nonPotential: 9,
      proposal: 12,
      negotiation: 10,
      won: 22,
      lost: 15
    }
  },
  "dept2": {
    stats: {
      newInquiries: 10,
      activeInquiries: 28,
      closeToSales: 5,
      sales: 8,
      overdue: 4
    },
    trends: {
      newInquiries: 7,
      activeInquiries: 5,
      closeToSales: 12,
      sales: 20,
      overdue: 6
    },
    salesVsInquiries: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      sales: [2, 4, 3, 5, 6, 7, 8, 8, 8],
      inquiries: [8, 9, 7, 12, 16, 18, 22, 25, 28]
    },
    leadStatuses: {
      new: 8,
      qualified: 6,
      nonPotential: 3,
      proposal: 5,
      negotiation: 4,
      won: 8,
      lost: 5
    }
  },
  "dept3": {
    stats: {
      newInquiries: 5,
      activeInquiries: 9,
      closeToSales: 1,
      sales: 2,
      overdue: 2
    },
    trends: {
      newInquiries: 20,
      activeInquiries: 15,
      closeToSales: 5,
      sales: 10,
      overdue: 5
    },
    salesVsInquiries: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      sales: [1, 1, 1, 1, 1, 1, 2, 3, 2],
      inquiries: [2, 3, 1, 3, 3, 4, 3, 7, 9]
    },
    leadStatuses: {
      new: 2,
      qualified: 1,
      nonPotential: 0,
      proposal: 1,
      negotiation: 1,
      won: 2,
      lost: 2
    }
  }
};

// Dummy branches and departments for development
const dummyBranches = [
  { id: "branch1", name: "Headquarters" },
  { id: "branch2", name: "North Branch" },
  { id: "branch3", name: "South Branch" }
];

const dummyDepartments = [
  { id: "dept1", name: "Sales Department" },
  { id: "dept2", name: "Marketing Department" },
  { id: "dept3", name: "Support Department" }
];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [dashboardData, setDashboardData] = useState(defaultDummyData);
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
          const userData = JSON.parse(storedUser);
          setUser(userData);
          // Set initial selected branch if user has one
          if (userData.branch) {
            setSelectedBranch(userData.branch);
          }
          // Set initial selected department if user has one
          if (userData.department) {
            setSelectedDepartment(userData.department);
          }
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

  // Fetch branches and departments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tenantId = localStorage.getItem('tenant_id');
        if (!tenantId) {
          console.error('No tenant ID found');
          return;
        }
        
        let branchesData = [];
        try {
          // Try to fetch branches from API
          branchesData = await branchService.getBranches(tenantId);
          console.log('API Branches:', branchesData);
          
          // If no branches returned, use dummy data
          if (!branchesData || branchesData.length === 0) {
            console.log('No branches from API, using dummy data');
            branchesData = dummyBranches;
          }
        } catch (error) {
          console.error('Error fetching branches, using dummy data:', error);
          branchesData = dummyBranches;
        }
        
        setBranches(branchesData);
        console.log('Set branches to:', branchesData);
        
        // If no branch is selected and user has a branch, select it
        if (!selectedBranch && user?.branch) {
          setSelectedBranch(user.branch);
        }
        
        let departmentsData = [];
        try {
          // Try to fetch departments from API
          departmentsData = await departmentService.getDepartments(tenantId);
          console.log('API Departments:', departmentsData);
          
          // If no departments returned, use dummy data
          if (!departmentsData || departmentsData.length === 0) {
            console.log('No departments from API, using dummy data');
            departmentsData = dummyDepartments;
          }
        } catch (error) {
          console.error('Error fetching departments, using dummy data:', error);
          departmentsData = dummyDepartments;
        }
        
        setDepartments(departmentsData);
        console.log('Set departments to:', departmentsData);
        
        // If no department is selected and user has a department, select it
        if (!selectedDepartment && user?.department) {
          setSelectedDepartment(user.department);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        // Use dummy data as fallback
        setBranches(dummyBranches);
        setDepartments(dummyDepartments);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]); // Don't include selectedBranch and selectedDepartment here to avoid rerun loops

  // Update dashboard data when filters change
  useEffect(() => {
    // Simulate fetching data based on branch and department selection
    const updateDashboardData = () => {
      console.log('Updating dashboard data with filters:', { 
        branch: selectedBranch, 
        department: selectedDepartment 
      });
      
      // Start with default data
      let newData = JSON.parse(JSON.stringify(defaultDummyData));
      
      // Check if we need to use a different branch ID format for the data lookup
      const getBranchDataKey = (branchId) => {
        // Check if the branchId exists directly in branchSpecificData
        if (branchId && branchSpecificData[branchId]) {
          return branchId;
        }
        
        // If this is a real UUID from the API but we have dummy data,
        // just use the first branch data as a fallback
        if (branchId && !branchSpecificData[branchId]) {
          console.log('Using fallback branch data for unknown branch ID:', branchId);
          return Object.keys(branchSpecificData)[0];
        }
        
        return null;
      };
      
      // Similar function for department data lookup
      const getDeptDataKey = (deptId) => {
        // Check if the deptId exists directly in departmentSpecificData
        if (deptId && departmentSpecificData[deptId]) {
          return deptId;
        }
        
        // If this is a real UUID from the API but we have dummy data,
        // just use the first department data as a fallback
        if (deptId && !departmentSpecificData[deptId]) {
          console.log('Using fallback department data for unknown department ID:', deptId);
          return Object.keys(departmentSpecificData)[0];
        }
        
        return null;
      };
      
      // Get the actual keys to use for data lookup
      const branchKey = getBranchDataKey(selectedBranch);
      const deptKey = getDeptDataKey(selectedDepartment);
      
      console.log('Using data keys:', { branchKey, deptKey });
      
      // If a branch is selected, merge branch-specific data
      if (branchKey) {
        console.log('Applying branch data for:', branchKey);
        newData = {
          ...newData,
          stats: { ...branchSpecificData[branchKey].stats },
          trends: { ...branchSpecificData[branchKey].trends },
          salesVsInquiries: { ...branchSpecificData[branchKey].salesVsInquiries },
          leadStatuses: { ...branchSpecificData[branchKey].leadStatuses }
        };
      }
      
      // If a department is selected, further modify with department-specific data
      if (deptKey) {
        console.log('Applying department data for:', deptKey);
        const deptData = departmentSpecificData[deptKey];
        
        if (branchKey) {
          // If both filters are applied, we show a subset of the branch data
          console.log('Applying combined branch+department data');
          
          // Take the lead status distribution from the department
          newData.leadStatuses = { ...deptData.leadStatuses };
          
          // Adjust stats to be a percentage of branch data (simulating departmental segment)
          Object.keys(newData.stats).forEach(key => {
            newData.stats[key] = Math.round(newData.stats[key] * 0.7); // 70% of branch data
          });
        } else {
          // If only department filter is applied, use department data directly
          console.log('Applying department-only data');
          newData.stats = { ...deptData.stats };
          newData.trends = { ...deptData.trends };
          newData.salesVsInquiries = { ...deptData.salesVsInquiries };
          newData.leadStatuses = { ...deptData.leadStatuses };
        }
      }
      
      console.log('New dashboard data:', newData);
      setDashboardData(newData);
    };
    
    // Only update if component is fully mounted
    if (!isLoading) {
      updateDashboardData();
    }
  }, [selectedBranch, selectedDepartment, isLoading]);

  // Handle branch change
  const handleBranchChange = (event) => {
    console.log('Branch changed to:', event.target.value);
    setSelectedBranch(event.target.value);
    // Dashboard data will be updated by the effect
  };
  
  // Handle department change
  const handleDepartmentChange = (event) => {
    console.log('Department changed to:', event.target.value);
    setSelectedDepartment(event.target.value);
    // Dashboard data will be updated by the effect
  };

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
          Here's what's happening with your {user?.tenant_name || 'organization'} today.
        </Typography>
        
        {/* Filters Section */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="branch-select-label">Select Branch</InputLabel>
            <Select
              labelId="branch-select-label"
              id="branch-select"
              value={selectedBranch}
              label="Select Branch"
              onChange={handleBranchChange}
              sx={{ 
                backgroundColor: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#9d277c',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#c34387',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#9d277c',
                }
              }}
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="department-select-label">Select Department</InputLabel>
            <Select
              labelId="department-select-label"
              id="department-select"
              value={selectedDepartment}
              label="Select Department"
              onChange={handleDepartmentChange}
              sx={{ 
                backgroundColor: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#9d277c',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#c34387',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#9d277c',
                }
              }}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {/* Active Filters */}
        {(selectedBranch || selectedDepartment) && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Showing data for:
            </Typography>
            {selectedBranch && (
              <Chip 
                size="small" 
                label={`Branch: ${branches.find(b => b.id === selectedBranch)?.name || 'Unknown Branch'}`}
                sx={{ backgroundColor: 'rgba(157, 39, 124, 0.1)', color: '#9d277c' }}
                onDelete={() => setSelectedBranch('')}
              />
            )}
            {selectedDepartment && (
              <Chip 
                size="small" 
                label={`Department: ${departments.find(d => d.id === selectedDepartment)?.name || 'Unknown Department'}`}
                sx={{ backgroundColor: 'rgba(195, 67, 135, 0.1)', color: '#c34387' }}
                onDelete={() => setSelectedDepartment('')}
              />
            )}
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {(selectedBranch || selectedDepartment) && (
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                      {selectedBranch && `Branch: ${branches.find(b => b.id === selectedBranch)?.name || 'Unknown'}`}
                      {selectedBranch && selectedDepartment && ' | '}
                      {selectedDepartment && `Dept: ${departments.find(d => d.id === selectedDepartment)?.name || 'Unknown'}`}
                    </Typography>
                  )}
                  <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {(selectedBranch || selectedDepartment) && (
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                      {selectedBranch && `Branch: ${branches.find(b => b.id === selectedBranch)?.name || 'Unknown'}`}
                      {selectedBranch && selectedDepartment && ' | '}
                      {selectedDepartment && `Dept: ${departments.find(d => d.id === selectedDepartment)?.name || 'Unknown'}`}
                    </Typography>
                  )}
                  <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 