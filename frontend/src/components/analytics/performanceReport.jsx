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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  AttachMoney as AttachMoneyIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { branchService, departmentService } from '../../services/api';
import { format } from 'date-fns';
import Chart from 'react-apexcharts';

// Dummy data for development
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

const dummyUsers = [
  { id: "user1", name: "John Doe" },
  { id: "user2", name: "Jane Smith" },
  { id: "user3", name: "Mike Johnson" }
];

const PerformanceReport = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Filter state
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [dateTo, setDateTo] = useState(new Date());

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
          if (userData.branch) {
            setSelectedBranch(userData.branch);
          }
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

  // Fetch branches, departments, and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        // For brevity, using dummy data
        setBranches(dummyBranches);
        setDepartments(dummyDepartments);
        setUsers(dummyUsers);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Handle filter changes
  const handleBranchChange = (event) => {
    setSelectedBranch(event.target.value);
  };
  
  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
  };
  
  const handleUserChange = (event) => {
    setSelectedUser(event.target.value);
  };
  
  const handleDateFromChange = (newDate) => {
    setDateFrom(newDate);
  };
  
  const handleDateToChange = (newDate) => {
    setDateTo(newDate);
  };

  const applyFilters = () => {
    console.log("Applying filters:", {
      branch: selectedBranch,
      department: selectedDepartment,
      user: selectedUser,
      dateFrom: format(dateFrom, 'yyyy-MM-dd'),
      dateTo: format(dateTo, 'yyyy-MM-dd')
    });
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LinearProgress sx={{ width: '80%' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Title Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Performance Report
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Detailed performance metrics and analytics for your organization.
        </Typography>
      </Box>
      
      {/* Filters Section */}
      <Card elevation={0} sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              <FilterListIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Filters
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="branch-select-label">Branch</InputLabel>
                <Select
                  labelId="branch-select-label"
                  id="branch-select"
                  value={selectedBranch}
                  label="Branch"
                  onChange={handleBranchChange}
                  sx={{ 
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
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
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="department-select-label">Department</InputLabel>
                <Select
                  labelId="department-select-label"
                  id="department-select"
                  value={selectedDepartment}
                  label="Department"
                  onChange={handleDepartmentChange}
                  sx={{ 
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
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
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="user-select-label">User</InputLabel>
                <Select
                  labelId="user-select-label"
                  id="user-select"
                  value={selectedUser}
                  label="User"
                  onChange={handleUserChange}
                  sx={{ 
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#9d277c',
                    }
                  }}
                >
                  <MenuItem value="">All Users</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="From"
                  value={dateFrom}
                  onChange={handleDateFromChange}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#9d277c',
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="To"
                  value={dateTo}
                  onChange={handleDateToChange}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#9d277c',
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="contained"
                fullWidth
                onClick={applyFilters}
                sx={{
                  backgroundColor: '#9d277c',
                  '&:hover': {
                    backgroundColor: '#c34387',
                  }
                }}
              >
                Apply Filters
              </Button>
            </Grid>
          </Grid>
          
          {/* Active Filters */}
          {(selectedBranch || selectedDepartment || selectedUser) && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Active filters:
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
              {selectedUser && (
                <Chip 
                  size="small" 
                  label={`User: ${users.find(u => u.id === selectedUser)?.name || 'Unknown User'}`}
                  sx={{ backgroundColor: 'rgba(247, 166, 247, 0.1)', color: '#f7a6f7' }}
                  onDelete={() => setSelectedUser('')}
                />
              )}
              <Chip 
                size="small" 
                label={`Date: ${format(dateFrom, 'MMM dd, yyyy')} - ${format(dateTo, 'MMM dd, yyyy')}`}
                sx={{ backgroundColor: 'rgba(130, 76, 150, 0.1)', color: '#824c96' }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* TODO: Add performance metrics cards, charts, and tables similar to analyticalReport.jsx */}
      <Typography variant="body1" align="center" sx={{ mt: 4 }}>
        Performance Report content to be implemented
      </Typography>
    </Box>
  );
};

export default PerformanceReport;
