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
  };
  
  const handleDateFromChange = (newDate) => {
    setDateFrom(newDate);
    setDateRangeType('custom');
  };
  
  const handleDateToChange = (newDate) => {
    setDateTo(newDate);
    setDateRangeType('custom');
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
      let data;
      
      try {
        data = await analyticsService.getLeadAnalytics(filters);
        console.log('Analytics data received:', data);
        
        if (data) {
          setStats(data.stats);
          setStatusWiseData(data.statusWiseData);
          setLeadTypeData(data.leadTypeData);
          setLeadSourceData(data.leadSourceData);
        } else {
          setError('No data returned for the selected filters');
        }
      } catch (error) {
        console.error('Error fetching analytics data, using dummy data:', error);
        // Fallback to dummy data
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

  // Function to display current state for debugging
  const showCurrentState = () => {
    console.log("Current state values:");
    console.log("Branches:", branches);
    console.log("Departments:", departments);
    console.log("Users:", users);
    console.log("Selected branch:", selectedBranch);
    console.log("Selected department:", selectedDepartment);
    console.log("Selected user:", selectedUser);

    // Show an alert with the count of items
    alert(`Current data:\nBranches: ${branches.length}\nDepartments: ${departments.length}\nUsers: ${users.length}`);
  };

  // Debug API connections
  const testApiConnection = async () => {
    console.log("Testing API connections...");
    setError(null);
    setIsLoadingFilters(true);
    
    try {
      // Test 1: Get current user
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        console.log("Current token:", token);
        
        const tenant_id = localStorage.getItem('tenant_id');
        console.log("Current tenant_id:", tenant_id);
      } catch (e) {
        console.error("Error checking token:", e);
      }
      
      // Test user filter specifically by making a direct request
      if (selectedUser) {
        console.log("Testing user filter specifically with user_id:", selectedUser);
        
        try {
          const token = localStorage.getItem('access_token') || localStorage.getItem('token');
          const tenantId = localStorage.getItem('tenant_id');
          const dateFrom = format(dateFrom || new Date(), 'yyyy-MM-dd');
          const dateTo = format(dateTo || new Date(), 'yyyy-MM-dd');
          
          const userFilterUrl = `${import.meta.env.VITE_API_BASE_URL}/api/analytics/lead-analytics/?tenant_id=${tenantId}&user_id=${selectedUser}&date_from=${dateFrom}&date_to=${dateTo}`;
          console.log("Making test request for user filtering:", userFilterUrl);
          
          const response = await fetch(userFilterUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log("User filter test response status:", response.status);
          if (response.ok) {
            const data = await response.json();
            console.log("User filter test data:", data);
            
            // Show the actual data if available
            if (data && data.statusWiseData) {
              console.log("Status-wise data with user filter:", data.statusWiseData);
              // Update the UI directly with this data
              setStatusWiseData(data.statusWiseData);
              setLeadTypeData(data.leadTypeData || []);
              setLeadSourceData(data.leadSourceData || []);
              setStats(data.stats || {});
              
              alert(`Data retrieved for user ${selectedUser}:\n${data.statusWiseData.length} statuses\n${data.leadTypeData ? data.leadTypeData.length : 0} lead types\n${data.leadSourceData ? data.leadSourceData.length : 0} sources`);
            }
          } else {
            console.error("User filter test error:", await response.text());
          }
        } catch (e) {
          console.error("Error testing user filter:", e);
        }
      }
      
      // Test 2: Direct filter options request with fetch to avoid any middleware issues
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const tenantId = user?.tenant_id || localStorage.getItem('tenant_id') || "1";
        
        console.log(`Making direct fetch to ${import.meta.env.VITE_API_BASE_URL}/api/analytics/filter-options/?tenant_id=${tenantId}`);
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/analytics/filter-options/?tenant_id=${tenantId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log("Direct filter options response:", response.status);
        console.log("Response headers:", Object.fromEntries([...response.headers.entries()]));
        
        if (response.ok) {
          const data = await response.json();
          console.log("Filter options data from direct fetch:", data);
          
          // IMPORTANT: Use the data directly from this fetch
          if (data.branches && data.branches.length > 0) {
            console.log("Setting branches from direct fetch:", data.branches);
            setBranches(data.branches);
          }
          
          if (data.departments && data.departments.length > 0) {
            console.log("Setting departments from direct fetch:", data.departments);
            setDepartments(data.departments);
          }
          
          if (data.users && data.users.length > 0) {
            console.log("Setting users from direct fetch:", data.users);
            setUsers(data.users);
          }
          
          return; // Exit early if direct fetch worked
        } else {
          console.error("Filter options error:", await response.text());
        }
      } catch (e) {
        console.error("Error with direct fetch for filter options:", e);
      }
      
      // Test 3: Try analyticsService as fallback
      try {
        console.log("Trying analyticsService.getFilterOptions() as fallback");
        const filterOptions = await analyticsService.getFilterOptions();
        console.log("Filter options from analyticsService:", filterOptions);
        
        if (filterOptions.branches && filterOptions.branches.length > 0) {
          console.log("Setting branches from analyticsService:", filterOptions.branches);
          setBranches(filterOptions.branches);
        }
        
        if (filterOptions.departments && filterOptions.departments.length > 0) {
          console.log("Setting departments from analyticsService:", filterOptions.departments);
          setDepartments(filterOptions.departments);
        }
        
        if (filterOptions.users && filterOptions.users.length > 0) {
          console.log("Setting users from analyticsService:", filterOptions.users);
          setUsers(filterOptions.users);
        }
        
        return; // Exit if this worked
      } catch (e) {
        console.error("Error with analyticsService.getFilterOptions():", e);
      }
      
      // Final fallback - try individual services directly
      console.log("Trying individual services as final fallback");
      
      // Try branches directly
      try {
        const tenantId = user?.tenant_id || localStorage.getItem('tenant_id') || "1";
        const branches = await branchService.getBranches(tenantId);
        console.log("Direct branches response:", branches);
        
        if (branches && branches.length > 0) {
          setBranches(branches);
        }
      } catch (e) {
        console.error("Error testing branches:", e);
      }
      
      // Try departments directly
      try {
        const tenantId = user?.tenant_id || localStorage.getItem('tenant_id') || "1";
        const departments = await departmentService.getDepartments(tenantId);
        console.log("Direct departments response:", departments);
        
        if (departments && departments.length > 0) {
          setDepartments(departments);
        }
      } catch (e) {
        console.error("Error testing departments:", e);
      }
      
      // Try users directly through auth/users endpoint
      try {
        const tenantId = user?.tenant_id || localStorage.getItem('tenant_id') || "1";
        const response = await api.get('/auth/users/', { params: { tenant_id: tenantId } });
        console.log("Direct users response:", response.data);
        
        if (response.data && response.data.results) {
          const userData = response.data.results.map(user => ({
            id: user.id,
            name: `${user.first_name} ${user.last_name}`.trim() || user.email
          }));
          setUsers(userData);
        }
      } catch (e) {
        console.error("Error testing users:", e);
      }
      
    } catch (error) {
      console.error("API test error:", error);
      setError("Error testing API connections. Check console for details.");
    } finally {
      setIsLoadingFilters(false);
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
            
            {/* Debug buttons */}
            {import.meta.env.MODE !== 'production' && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  color="info" 
                  onClick={testApiConnection}
                  startIcon={<RefreshIcon />}
                  disabled={isLoadingFilters}
                >
                  {isLoadingFilters ? 'Testing...' : 'Test API'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  onClick={showCurrentState}
                >
                  Show Data
                </Button>
              </Box>
            )}
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
          <Tab label="Sales Analytics" value="salesAnalytics" />
          {canViewConversionMetrics && <Tab label="Conversion Funnel" value="conversionFunnel" />}
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
        <Typography variant="h6" gutterBottom>
          User Performance
        </Typography>
        {stats ? (
          <Typography>
            User performance data would be displayed here with charts and metrics.
          </Typography>
        ) : !isLoadingAnalytics && (
          <Typography color="text.secondary">
            No user performance data available. Try adjusting your filters.
          </Typography>
        )}
      </TabPanel>
      
      <TabPanel value={dateRangeType} index="salesAnalytics">
        <Typography variant="h6" gutterBottom>
          Sales Analytics
        </Typography>
        {stats ? (
          <Typography>
            Sales analytics data would be displayed here with charts and metrics.
          </Typography>
        ) : !isLoadingAnalytics && (
          <Typography color="text.secondary">
            No sales analytics data available. Try adjusting your filters.
          </Typography>
        )}
      </TabPanel>
      
      {canViewConversionMetrics && (
        <TabPanel value={dateRangeType} index="conversionFunnel">
          <Typography variant="h6" gutterBottom>
            Conversion Funnel
          </Typography>
          {stats ? (
            <Typography>
              Conversion funnel data would be displayed here with charts and metrics.
            </Typography>
          ) : !isLoadingAnalytics && (
            <Typography color="text.secondary">
              No conversion funnel data available. Try adjusting your filters.
            </Typography>
          )}
        </TabPanel>
      )}
    </Box>
  );
};

export default AnalyticalReport;
