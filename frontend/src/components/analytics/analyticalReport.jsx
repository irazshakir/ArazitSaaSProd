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
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Alert,
  TablePagination,
  InputAdornment,
  CircularProgress
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
  CalendarToday as CalendarTodayIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { branchService, departmentService, userService } from '../../services/api';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import analyticsService, { hasFeatureAccess } from '../../services/analyticsService';
import { getUser, getUserRole } from '../../utils/auth';

// Tab panel component for different analytics sections
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const AnalyticalReport = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Add console log to debug component rendering
  console.log('AnalyticalReport component rendering');

  // Filter state
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [dateFrom, setDateFrom] = useState(startOfMonth(subMonths(new Date(), 1)));
  const [dateTo, setDateTo] = useState(endOfMonth(new Date()));
  const [dateRangeType, setDateRangeType] = useState('custom');
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);

  // Stats data - initialize with empty data instead of dummy data
  const [stats, setStats] = useState({
    newInquiries: 0,
    activeInquiries: 0,
    closedInquiries: 0,
    closeToSales: 0,
    sales: 0,
    overdue: 0
  });
  const [statusWiseData, setStatusWiseData] = useState([]);
  const [leadTypeData, setLeadTypeData] = useState([]);
  const [leadSourceData, setLeadSourceData] = useState([]);
  const [userPerformanceData, setUserPerformanceData] = useState([]);

  // UI states
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [error, setError] = useState(null);
  
  // Get permissions based on role
  const canExportReports = hasFeatureAccess('analytics.export_reports');
  const canViewLeadSourceAnalysis = hasFeatureAccess('analytics.lead_source_analysis');
  const canViewConversionMetrics = hasFeatureAccess('analytics.conversion_metrics');
  const canViewTeamComparison = hasFeatureAccess('analytics.team_comparison');
  const canViewAllBranches = hasFeatureAccess('dashboard.all_branch_view');
  const canViewAllDepartments = hasFeatureAccess('dashboard.all_department_view');
  
  // Get user role from utility function
  const userRole = getUserRole();
  
  // Marketing Analytics state
  const [marketingData, setMarketingData] = useState([]);
  const [marketingTotals, setMarketingTotals] = useState({
    source: 'Total',
    created: 0,
    qualified: 0,
    non_potential: 0,
    sales: 0,
    conversion_ratio: 0
  });
  const [isLoadingMarketingData, setIsLoadingMarketingData] = useState(false);
  
  // Get user from localStorage
  useEffect(() => {
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

  // Fetch branches, departments, and users from the API
  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!user) {
        console.log("No user found, skipping filter options fetch");
        return;
      }
      
      setIsLoadingFilters(true);
      console.log("Starting to fetch filter options, user:", user);
      
      try {
        // Log tenant_id from localStorage
        const tenantId = localStorage.getItem('tenant_id');
        console.log("Tenant ID from localStorage:", tenantId);
        
        // Fetch filter options from API
        console.log("Calling analyticsService.getFilterOptions()");
        const filterOptions = await analyticsService.getFilterOptions();
        console.log('Filter options from API (RAW):', filterOptions);
        
        // CRITICAL: Remove dummy data - ensure we're using API data
        
        // Set branches
        if (filterOptions.branches && filterOptions.branches.length > 0) {
          console.log("Setting branches from API:", filterOptions.branches);
          setBranches(filterOptions.branches);
          // If user has a branch, select it by default
          if (user && user.branch_id) {
            const userBranch = filterOptions.branches.find(b => {
              // Add null checks to prevent toString() errors
              return b && b.id && user.branch_id && 
                String(b.id) === String(user.branch_id);
            });
            if (userBranch) {
              setSelectedBranch(userBranch.id);
            }
          }
        } else {
          console.log("No branches returned from API");
          setBranches([]);
        }
        
        // Set departments
        if (filterOptions.departments && filterOptions.departments.length > 0) {
          console.log("Setting departments from API:", filterOptions.departments);
          setDepartments(filterOptions.departments);
          // If user has a department, select it by default
          if (user && user.department_id) {
            const userDept = filterOptions.departments.find(d => {
              // Add null checks to prevent toString() errors
              return d && d.id && user.department_id && 
                String(d.id) === String(user.department_id);
            });
            if (userDept) {
              setSelectedDepartment(userDept.id);
            }
          }
        } else {
          console.log("No departments returned from API");
          setDepartments([]);
        }
        
        // Set users
        if (filterOptions.users && filterOptions.users.length > 0) {
          console.log("Setting users from API:", filterOptions.users);
          setUsers(filterOptions.users);
          // Select the current user by default
          if (user && user.id) {
            const currentUser = filterOptions.users.find(u => {
              // Add null checks to prevent toString() errors  
              return u && u.id && user.id && 
                String(u.id) === String(user.id);
            });
            if (currentUser) {
              setSelectedUser(currentUser.id);
            }
          }
        } else {
          console.log("No users returned from API");
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
        console.error('Error details:', error.response?.data || error.message || error);
        
        // DO NOT use dummy data anymore - just use empty arrays
        console.log("Using empty arrays instead of dummy data");
        setBranches([]);
        setDepartments([]);
        setUsers([]);
      } finally {
        setIsLoadingFilters(false);
      }
    };

    if (user) {
      fetchFilterOptions();
    }
  }, [user]);

  // Fetch analytics data when filters change
  useEffect(() => {
    // Only load initial data if user is loaded and not in loading state
    if (!isLoading && user) {
      applyFilters();
    }
  }, [isLoading, user]);

  // Handle filter changes
  const handleBranchChange = (event) => {
    console.log('Branch changed to:', event.target.value);
    setSelectedBranch(event.target.value);
    // Analytics data will be updated when applyFilters is called
  };
  
  const handleDepartmentChange = (event) => {
    console.log('Department changed to:', event.target.value);
    setSelectedDepartment(event.target.value);
    // Analytics data will be updated when applyFilters is called
  };
  
  const handleUserChange = (event) => {
    console.log('User changed to:', event.target.value);
    setSelectedUser(event.target.value);
    // Analytics data will be updated when applyFilters is called
  };
  
  const handleTabChange = (event, newValue) => {
    setDateRangeType(newValue);
    
    // If switching to lead analytics tab, fetch leads data
    if (newValue === 'leadAnalytics' && leadsData.length === 0) {
      fetchLeadsData({ page: 1 });
    }
    
    // If switching to user performance tab, fetch user performance data
    if (newValue === 'userPerformance') {
      fetchUserPerformanceData();
    }
    
    // If switching to marketing analytics tab, fetch marketing data
    if (newValue === 'marketingAnalytics') {
      fetchMarketingData();
    }
  };
  
  const handleDateFromChange = (newDate) => {
    setDateFrom(newDate);
    setDateRangeType('custom');
  };
  
  const handleDateToChange = (newDate) => {
    setDateTo(newDate);
    setDateRangeType('custom');
  };

  // Fetch user performance data
  const fetchUserPerformanceData = async () => {
    setIsLoadingAnalytics(true);
    setError(null);
    try {
      // Build filters object
      const filters = {
        date_from: format(dateFrom, 'yyyy-MM-dd'),
        date_to: format(dateTo, 'yyyy-MM-dd')
      };
      
      // Add filters if selected
      if (selectedBranch) filters.branch_id = selectedBranch;
      if (selectedDepartment) filters.department_id = selectedDepartment;
      if (selectedUser) filters.user_id = selectedUser;
      
      console.log('Fetching user performance with filters:', filters);
      
      const data = await analyticsService.getUserPerformance(filters);
      
      if (data && data.userPerformance) {
        console.log('User performance data received:', data.userPerformance);
        setUserPerformanceData(data.userPerformance);
      } else {
        console.log('No user performance data returned');
        setUserPerformanceData([]);
      }
    } catch (error) {
      console.error('Error fetching user performance data:', error);
      
      // Extract the specific error message
      let errorMessage = 'Failed to load user performance data.';
      if (error.response?.data?.error) {
        errorMessage += ' ' + error.response.data.error;
      } else if (error.message) {
        errorMessage += ' ' + error.message;
      }
      
      setError(errorMessage);
      setUserPerformanceData([]);
      
      // Try to provide more helpful debug info
      if (error.toString().includes('LeadEvent is not defined')) {
        console.error('The LeadEvent model is not properly imported in the backend views.py file.');
      }
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Fetch marketing analytics data
  const fetchMarketingData = async () => {
    setIsLoadingMarketingData(true);
    setError(null);
    try {
      // Build filters object
      const filters = {
        date_from: format(dateFrom, 'yyyy-MM-dd'),
        date_to: format(dateTo, 'yyyy-MM-dd')
      };
      
      // Add filters if selected
      if (selectedBranch) filters.branch_id = selectedBranch;
      if (selectedDepartment) filters.department_id = selectedDepartment;
      if (selectedUser) filters.user_id = selectedUser;
      
      console.log('Fetching marketing analytics with filters:', filters);
      
      const data = await analyticsService.getMarketingAnalytics(filters);
      
      if (data && data.marketingData) {
        console.log('Marketing data received:', data.marketingData);
        setMarketingData(data.marketingData);
        
        if (data.totals) {
          setMarketingTotals(data.totals);
        }
      } else {
        console.log('No marketing data returned');
        setMarketingData([]);
        setMarketingTotals({
          source: 'Total',
          created: 0,
          qualified: 0,
          non_potential: 0,
          sales: 0,
          conversion_ratio: 0
        });
      }
    } catch (error) {
      console.error('Error fetching marketing data:', error);
      
      // Extract the specific error message
      let errorMessage = 'Failed to load marketing analytics data.';
      if (error.response?.data?.error) {
        errorMessage += ' ' + error.response.data.error;
      } else if (error.message) {
        errorMessage += ' ' + error.message;
      }
      
      setError(errorMessage);
      setMarketingData([]);
      setMarketingTotals({
        source: 'Total',
        created: 0,
        qualified: 0,
        non_potential: 0,
        sales: 0,
        conversion_ratio: 0
      });
    } finally {
      setIsLoadingMarketingData(false);
    }
  };

  // Apply filters and fetch data
  const applyFilters = async (branch = selectedBranch, department = selectedDepartment, user = selectedUser, from = dateFrom, to = dateTo, rangeType = dateRangeType) => {
    setIsLoadingAnalytics(true);
    setError(null);
    
    try {
      // Build filters object
      const filters = {
        date_from: format(from, 'yyyy-MM-dd'),
        date_to: format(to, 'yyyy-MM-dd'),
        date_range_type: rangeType
      };
      
      // Only add these filters if they're selected and the user has permission
      if (branch) {
        filters.branch_id = branch;
      }
      
      if (department) {
        filters.department_id = department;
      }
      
      if (user) {
        filters.user_id = user;
      }
      
      console.log('Applying analytics filters:', filters);
      
      // Fetch analytics data based on active tab
      try {
        if (rangeType === 'leadAnalytics') {
          // Fetch lead analytics data
          const data = await analyticsService.getLeadAnalytics(filters);
          console.log('Lead analytics data received:', data);
          
          if (data) {
            setStats(data.stats);
            setStatusWiseData(data.statusWiseData);
            setLeadTypeData(data.leadTypeData);
            setLeadSourceData(data.leadSourceData);
          } else {
            setError('No data returned for the selected filters');
          }
        } else if (rangeType === 'userPerformance') {
          // Fetch user performance data
          await fetchUserPerformanceData();
        } else if (rangeType === 'marketingAnalytics') {
          // Fetch marketing analytics data
          await fetchMarketingData();
        } else {
          // Fetch lead analytics data for other tabs (fallback)
          const data = await analyticsService.getLeadAnalytics(filters);
          console.log('Analytics data received:', data);
          
          if (data) {
            setStats(data.stats);
            setStatusWiseData(data.statusWiseData);
            setLeadTypeData(data.leadTypeData);
            setLeadSourceData(data.leadSourceData);
          } else {
            setError('No data returned for the selected filters');
          }
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        // Clear the data
        setStats({
          newInquiries: 0,
          activeInquiries: 0,
          closedInquiries: 0,
          closeToSales: 0,
          sales: 0,
          overdue: 0
        });
        setStatusWiseData([]);
        setLeadTypeData([]);
        setLeadSourceData([]);
        setUserPerformanceData([]);
        setMarketingData([]);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
      setError(error.message || 'Failed to apply filters');
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Handle predefined date ranges
  const handleDateRangeChange = (event) => {
    const range = event.target.value;
    setDateRangeType(range);
    
    let newFrom, newTo;
    const today = new Date();
    
    switch (range) {
      case 'last7days':
        newFrom = subMonths(today, 0.25);
        newTo = today;
        break;
      case 'last30days':
        newFrom = subMonths(today, 1);
        newTo = today;
        break;
      case 'last90days':
        newFrom = subMonths(today, 3);
        newTo = today;
        break;
      case 'thisMonth':
        newFrom = startOfMonth(today);
        newTo = today;
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        newFrom = startOfMonth(lastMonth);
        newTo = endOfMonth(lastMonth);
        break;
      default:
        return; // Keep existing dates for 'custom'
    }
    
    setDateFrom(newFrom);
    setDateTo(newTo);
    
    // Apply the new date range
    applyFilters(selectedBranch, selectedDepartment, selectedUser, newFrom, newTo, range);
  };
  
  const handleExport = () => {
    // Implement export functionality - this will depend on your backend API
    console.log('Exporting report with filters:', {
      branch: selectedBranch,
      department: selectedDepartment,
      user: selectedUser,
      dateFrom: format(dateFrom, 'yyyy-MM-dd'),
      dateTo: format(dateTo, 'yyyy-MM-dd')
    });
    
    // Implement your export logic here
    // Example: window.open(`/api/analytics/export?branch=${selectedBranch}&department=${selectedDepartment}...`);
  };

  // Lead Analytics table state
  const [leadsData, setLeadsData] = useState([]);
  const [leadsTableLoading, setLeadsTableLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0, // MUI Tables use 0-based pagination
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [activityStatusFilter, setActivityStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusOptions, setStatusOptions] = useState([]);
  const [activityStatusOptions, setActivityStatusOptions] = useState([]);
  
  // Fetch leads data for the table
  const fetchLeadsData = async (options = {}) => {
    setLeadsTableLoading(true);
    try {
      // Combine filters
      const combinedOptions = {
        page: pagination.page + 1, // API uses 1-based pagination
        pageSize: pagination.pageSize,
        status: statusFilter,
        activityStatus: activityStatusFilter,
        search: searchQuery,
        date_from: format(dateFrom, 'yyyy-MM-dd'),
        date_to: format(dateTo, 'yyyy-MM-dd'),
        ...options
      };
      
      // Add branch/department/user filters
      if (selectedBranch) combinedOptions.branch_id = selectedBranch;
      if (selectedDepartment) combinedOptions.department_id = selectedDepartment;
      if (selectedUser) combinedOptions.user_id = selectedUser;
      
      console.log('Fetching lead analytics with options:', combinedOptions);
      
      // Fetch data
      const data = await analyticsService.getLeadsTableData(combinedOptions);
      console.log('Lead analytics response:', data);
      
      // Update table data
      if (data && data.leadsTable) {
        setLeadsData(data.leadsTable.leads || []);
        
        // Update pagination info (convert from 1-based to 0-based for MUI)
        const apiPagination = data.leadsTable.pagination;
        setPagination({
          page: apiPagination.page - 1,
          pageSize: apiPagination.pageSize,
          totalCount: apiPagination.totalCount,
          totalPages: apiPagination.totalPages
        });
        
        // Update filter options
        if (data.leadsTable.filters) {
          setStatusOptions(data.leadsTable.filters.statuses || []);
          setActivityStatusOptions(data.leadsTable.filters.activityStatuses || []);
        }
        
        // Update charts and stats
        if (data.stats) setStats(data.stats);
        if (data.statusWiseData) setStatusWiseData(data.statusWiseData);
        if (data.leadTypeData) setLeadTypeData(data.leadTypeData);
        if (data.leadSourceData) setLeadSourceData(data.leadSourceData);
      }
    } catch (error) {
      console.error('Error fetching leads data:', error.response?.data || error.message || error);
      setError('Failed to load leads data. ' + (error.response?.data?.error || error.message || 'Unknown error'));
    } finally {
      setLeadsTableLoading(false);
    }
  };
  
  // Handle pagination change
  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchLeadsData({ page: newPage + 1 }); // API uses 1-based pagination
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 0 }));
    fetchLeadsData({ pageSize: newPageSize, page: 1 });
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    const newStatus = event.target.value;
    setStatusFilter(newStatus);
    fetchLeadsData({ status: newStatus, page: 1 });
  };
  
  // Handle activity status filter change
  const handleActivityStatusFilterChange = (event) => {
    const newActivityStatus = event.target.value;
    setActivityStatusFilter(newActivityStatus);
    fetchLeadsData({ activityStatus: newActivityStatus, page: 1 });
  };
  
  // Handle search
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  const handleSearchSubmit = (event) => {
    if (event.key === 'Enter') {
      fetchLeadsData({ search: searchQuery, page: 1 });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LinearProgress color="secondary" sx={{ width: '50%' }} />
      </Box>
    );
  }
  
  if (error && !stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Title Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Analytical Report
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Comprehensive analysis of your organization's performance and metrics.
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
          
          {isLoadingFilters ? (
            <Box sx={{ width: '100%', py: 2 }}>
              <LinearProgress color="secondary" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Loading filter options...
              </Typography>
            </Box>
          ) : (
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
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#c34387',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
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
                  onClick={() => applyFilters(selectedBranch, selectedDepartment, selectedUser, dateFrom, dateTo, dateRangeType)}
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
          )}
          
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
      
      {/* Loading indicator */}
      {isLoadingAnalytics && (
        <Box sx={{ width: '100%', mb: 4 }}>
          <LinearProgress color="secondary" />
        </Box>
      )}
      
      {/* Error display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 4 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setError(null)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}
      
      {/* Analytics Tabs */}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Tabs 
          value={dateRangeType} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#9d277c',
            },
            '& .Mui-selected': {
              color: '#9d277c !important',
            }
          }}
        >
          <Tab label="Lead Analytics" value="leadAnalytics" />
          <Tab label="User Performance" value="userPerformance" />
          <Tab label="Marketing Analytics" value="marketingAnalytics" />
        </Tabs>
      </Box>
      
      {/* Tab Panels */}
      <TabPanel value={dateRangeType} index="leadAnalytics">
        <Box>
          {/* Status-wise Lead Statistics Table */}
          <Paper elevation={0} sx={{ borderRadius: 2, mb: 4, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                    <TableCell>Distribution</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statusWiseData.length > 0 ? (
                    statusWiseData.map((row) => (
                      <TableRow key={row.status}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box 
                              sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                backgroundColor: 
                                  row.status === 'Won' ? '#4caf50' :
                                  row.status === 'Lost' ? '#f44336' :
                                  row.status === 'Negotiation' ? '#ff9800' :
                                  row.status === 'Proposal' ? '#2196f3' :
                                  row.status === 'Qualified' ? '#9c27b0' :
                                  row.status === 'Non-Potential' ? '#795548' :
                                  '#3f51b5',
                                mr: 1.5
                              }} 
                            />
                            <Typography fontWeight={500}>{row.status}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600}>{row.count}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={500}>{row.percentage.toFixed(1)}%</Typography>
                        </TableCell>
                        <TableCell width="30%">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box 
                              sx={{ 
                                flexGrow: 1,
                                mr: 1,
                                height: 8,
                                borderRadius: 4,
                                bgcolor: '#f0f0f0',
                                overflow: 'hidden'
                              }}
                            >
                              <Box 
                                sx={{ 
                                  height: '100%',
                                  width: `${row.percentage}%`,
                                  bgcolor: 
                                    row.status === 'Won' ? '#4caf50' :
                                    row.status === 'Lost' ? '#f44336' :
                                    row.status === 'Negotiation' ? '#ff9800' :
                                    row.status === 'Proposal' ? '#2196f3' :
                                    row.status === 'Qualified' ? '#9c27b0' :
                                    row.status === 'Non-Potential' ? '#795548' :
                                    '#3f51b5',
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        {isLoadingAnalytics ? (
                          <CircularProgress size={24} sx={{ color: '#9d277c' }} />
                        ) : (
                          'No lead data available for the selected filters.'
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  {statusWiseData.length > 0 && (
                    <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {statusWiseData.reduce((sum, item) => sum + item.count, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>100%</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </TabPanel>
      
      <TabPanel value={dateRangeType} index="userPerformance">
        <Box>
          {/* User Performance Table */}
          <Paper elevation={0} sx={{ borderRadius: 2, mb: 4, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>User Name</TableCell>
                    <TableCell align="right">Assigned Leads</TableCell>
                    <TableCell align="right">Sales</TableCell>
                    <TableCell align="right">Conversion Ratio</TableCell>
                    <TableCell>Distribution</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoadingAnalytics ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={24} sx={{ color: '#9d277c' }} />
                      </TableCell>
                    </TableRow>
                  ) : userPerformanceData.length > 0 ? (
                    userPerformanceData.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32,
                                bgcolor: user.role === 'sales_agent' ? '#2196f3' : '#9c27b0',
                                mr: 1.5,
                                fontSize: '0.875rem'
                              }}
                            >
                              {user.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography fontWeight={500}>{user.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user.role === 'sales_agent' ? 'Sales Agent' : 'Support Agent'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600}>{user.assigned_leads}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600} sx={{ color: '#4caf50' }}>
                            {user.sales}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={500}>
                            {user.conversion_ratio}%
                          </Typography>
                        </TableCell>
                        <TableCell width="30%">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box 
                              sx={{ 
                                flexGrow: 1,
                                mr: 1,
                                height: 8,
                                borderRadius: 4,
                                bgcolor: '#f0f0f0',
                                overflow: 'hidden'
                              }}
                            >
                              <Box 
                                sx={{ 
                                  height: '100%',
                                  width: `${user.conversion_ratio}%`,
                                  bgcolor: user.conversion_ratio > 50 ? '#4caf50' : 
                                           user.conversion_ratio > 30 ? '#ff9800' : '#f44336',
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        No user performance data available for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                  {userPerformanceData.length > 0 && (
                    <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {userPerformanceData.reduce((sum, user) => sum + user.assigned_leads, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {userPerformanceData.reduce((sum, user) => sum + user.sales, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {userPerformanceData.length > 0 
                          ? Math.round(userPerformanceData.reduce((sum, user) => sum + user.conversion_ratio, 0) / userPerformanceData.length) 
                          : 0}%
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </TabPanel>
      
      <TabPanel value={dateRangeType} index="marketingAnalytics">
        <Box>
          {/* Marketing Analytics Table */}
          <Paper elevation={0} sx={{ borderRadius: 2, mb: 4, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Lead Source</TableCell>
                    <TableCell align="right">Created</TableCell>
                    <TableCell align="right">Qualified</TableCell>
                    <TableCell align="right">Non-Potential</TableCell>
                    <TableCell align="right">Sales</TableCell>
                    <TableCell align="right">Conversion Ratio</TableCell>
                    <TableCell>Distribution</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoadingMarketingData || isLoadingAnalytics ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={24} sx={{ color: '#9d277c' }} />
                      </TableCell>
                    </TableRow>
                  ) : marketingData.length > 0 ? (
                    marketingData.map((row) => (
                      <TableRow key={row.source}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box 
                              sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                // Different colors for different sources
                                backgroundColor: 
                                  row.source === 'FB Form' ? '#4267B2' :
                                  row.source === 'Messenger' ? '#00B2FF' :
                                  row.source === 'WhatsApp' ? '#25D366' :
                                  row.source === 'Insta Form' ? '#C13584' :
                                  row.source === 'Website Form' ? '#2196f3' :
                                  row.source === 'Website Chat' ? '#2979FF' :
                                  row.source === 'Referral' ? '#FF9800' :
                                  row.source === 'Walkin' ? '#4CAF50' :
                                  `hsl(${row.source.charCodeAt(0) * 10 % 360}, 70%, 50%)`,
                                mr: 1.5
                              }} 
                            />
                            <Typography fontWeight={500}>{row.source}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600}>{row.created}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography>{row.qualified}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography color="text.secondary">{row.non_potential}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600} sx={{ color: '#4caf50' }}>
                            {row.sales}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={500} sx={{ 
                            color: row.conversion_ratio > 50 ? '#4caf50' : 
                                   row.conversion_ratio > 30 ? '#ff9800' : '#f44336',
                          }}>
                            {row.conversion_ratio}%
                          </Typography>
                        </TableCell>
                        <TableCell width="20%">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box 
                              sx={{ 
                                flexGrow: 1,
                                mr: 1,
                                height: 8,
                                borderRadius: 4,
                                bgcolor: '#f0f0f0',
                                overflow: 'hidden'
                              }}
                            >
                              <Box 
                                sx={{ 
                                  height: '100%',
                                  width: `${row.conversion_ratio}%`,
                                  bgcolor: row.conversion_ratio > 50 ? '#4caf50' : 
                                           row.conversion_ratio > 30 ? '#ff9800' : '#f44336',
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        No marketing data available for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                  {marketingData.length > 0 && (
                    <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>{marketingTotals.source}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {marketingTotals.created}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {marketingTotals.qualified}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {marketingTotals.non_potential}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                        {marketingTotals.sales}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {marketingTotals.conversion_ratio}%
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ p: 2, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                * Created: Total leads from the source | Sales: Leads with status 'Won' | Conversion: Sales/Created
              </Typography>
              
              {canExportReports && (
                <Button
                  startIcon={<DownloadIcon />}
                  size="small"
                  onClick={handleExport}
                  sx={{ 
                    backgroundColor: 'rgba(157, 39, 124, 0.1)', 
                    color: '#9d277c',
                    '&:hover': {
                      backgroundColor: 'rgba(157, 39, 124, 0.2)'
                    }
                  }}
                >
                  Export
                </Button>
              )}
            </Box>
          </Paper>
        </Box>
      </TabPanel>
    </Box>
  );
};

export default AnalyticalReport;
