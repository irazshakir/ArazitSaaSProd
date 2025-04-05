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
  Alert
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
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { branchService, departmentService, userService } from '../../services/api';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import analyticsService, { hasFeatureAccess } from '../../services/analyticsService';
import { getUser, getUserRole } from '../../utils/auth';

// Dummy data
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

const dummyStats = {
  newInquiries: 47,
  activeInquiries: 124,
  closedInquiries: 85,
  closeToSales: 18,
  sales: 32,
  overdue: 15
};

const dummyStatusWiseData = [
  { status: 'New', count: 35, percentage: 15 },
  { status: 'Qualified', count: 25, percentage: 11 },
  { status: 'Non-Potential', count: 12, percentage: 5 },
  { status: 'Proposal', count: 18, percentage: 8 },
  { status: 'Negotiation', count: 15, percentage: 7 },
  { status: 'Won', count: 32, percentage: 14 },
  { status: 'Lost', count: 22, percentage: 10 }
];

const dummyLeadTypeData = [
  { type: 'Hajj Packages', count: 45, percentage: 20 },
  { type: 'Custom Umrah', count: 38, percentage: 17 },
  { type: 'Readymade Umrah', count: 32, percentage: 14 },
  { type: 'Flights', count: 28, percentage: 12 },
  { type: 'Transfers', count: 20, percentage: 9 },
  { type: 'Visas', count: 35, percentage: 15 },
  { type: 'Hotel Booking', count: 30, percentage: 13 }
];

const dummyLeadSourceData = [
  { source: 'WhatsApp', count: 55, percentage: 24 },
  { source: 'FB Form', count: 30, percentage: 13 },
  { source: 'Messenger', count: 25, percentage: 11 },
  { source: 'Website Form', count: 40, percentage: 17 },
  { source: 'Website Chat', count: 22, percentage: 10 },
  { source: 'SEO', count: 30, percentage: 13 },
  { source: 'Google Ads', count: 28, percentage: 12 }
];

// Branch specific dummy data
const branchSpecificData = {
  "branch1": {
    stats: {
      newInquiries: 47,
      activeInquiries: 124,
      closedInquiries: 85,
      closeToSales: 18,
      sales: 32,
      overdue: 15
    },
    statusWiseData: [
      { status: 'New', count: 35, percentage: 15 },
      { status: 'Qualified', count: 25, percentage: 11 },
      { status: 'Non-Potential', count: 12, percentage: 5 },
      { status: 'Proposal', count: 18, percentage: 8 },
      { status: 'Negotiation', count: 15, percentage: 7 },
      { status: 'Won', count: 32, percentage: 14 },
      { status: 'Lost', count: 22, percentage: 10 }
    ],
    leadTypeData: [
      { type: 'Hajj Packages', count: 45, percentage: 20 },
      { type: 'Custom Umrah', count: 38, percentage: 17 },
      { type: 'Readymade Umrah', count: 32, percentage: 14 },
      { type: 'Flights', count: 28, percentage: 12 },
      { type: 'Transfers', count: 20, percentage: 9 },
      { type: 'Visas', count: 35, percentage: 15 },
      { type: 'Hotel Booking', count: 30, percentage: 13 }
    ],
    leadSourceData: [
      { source: 'WhatsApp', count: 55, percentage: 24 },
      { source: 'FB Form', count: 30, percentage: 13 },
      { source: 'Messenger', count: 25, percentage: 11 },
      { source: 'Website Form', count: 40, percentage: 17 },
      { source: 'Website Chat', count: 22, percentage: 10 },
      { source: 'SEO', count: 30, percentage: 13 },
      { source: 'Google Ads', count: 28, percentage: 12 }
    ]
  },
  "branch2": {
    stats: {
      newInquiries: 32,
      activeInquiries: 76,
      closedInquiries: 62,
      closeToSales: 14,
      sales: 18,
      overdue: 9
    },
    statusWiseData: [
      { status: 'New', count: 25, percentage: 18 },
      { status: 'Qualified', count: 18, percentage: 13 },
      { status: 'Non-Potential', count: 8, percentage: 6 },
      { status: 'Proposal', count: 15, percentage: 11 },
      { status: 'Negotiation', count: 10, percentage: 7 },
      { status: 'Won', count: 18, percentage: 13 },
      { status: 'Lost', count: 14, percentage: 10 }
    ],
    leadTypeData: [
      { type: 'Hajj Packages', count: 28, percentage: 22 },
      { type: 'Custom Umrah', count: 24, percentage: 19 },
      { type: 'Readymade Umrah', count: 20, percentage: 16 },
      { type: 'Flights', count: 15, percentage: 12 },
      { type: 'Transfers', count: 12, percentage: 9 },
      { type: 'Visas', count: 18, percentage: 14 },
      { type: 'Hotel Booking', count: 10, percentage: 8 }
    ],
    leadSourceData: [
      { source: 'WhatsApp', count: 32, percentage: 29 },
      { source: 'FB Form', count: 18, percentage: 16 },
      { source: 'Messenger', count: 14, percentage: 13 },
      { source: 'Website Form', count: 20, percentage: 18 },
      { source: 'Website Chat', count: 10, percentage: 9 },
      { source: 'SEO', count: 8, percentage: 7 },
      { source: 'Google Ads', count: 9, percentage: 8 }
    ]
  },
  "branch3": {
    stats: {
      newInquiries: 18,
      activeInquiries: 42,
      closedInquiries: 38,
      closeToSales: 8,
      sales: 12,
      overdue: 6
    },
    statusWiseData: [
      { status: 'New', count: 15, percentage: 17 },
      { status: 'Qualified', count: 12, percentage: 14 },
      { status: 'Non-Potential', count: 6, percentage: 7 },
      { status: 'Proposal', count: 9, percentage: 10 },
      { status: 'Negotiation', count: 7, percentage: 8 },
      { status: 'Won', count: 12, percentage: 14 },
      { status: 'Lost', count: 10, percentage: 11 }
    ],
    leadTypeData: [
      { type: 'Hajj Packages', count: 16, percentage: 19 },
      { type: 'Custom Umrah', count: 14, percentage: 16 },
      { type: 'Readymade Umrah', count: 12, percentage: 14 },
      { type: 'Flights', count: 10, percentage: 12 },
      { type: 'Transfers', count: 8, percentage: 9 },
      { type: 'Visas', count: 15, percentage: 17 },
      { type: 'Hotel Booking', count: 11, percentage: 13 }
    ],
    leadSourceData: [
      { source: 'WhatsApp', count: 20, percentage: 26 },
      { source: 'FB Form', count: 12, percentage: 16 },
      { source: 'Messenger', count: 8, percentage: 10 },
      { source: 'Website Form', count: 15, percentage: 19 },
      { source: 'Website Chat', count: 6, percentage: 8 },
      { source: 'SEO', count: 9, percentage: 12 },
      { source: 'Google Ads', count: 7, percentage: 9 }
    ]
  }
};

// User specific dummy data
const userSpecificData = {
  "user1": {
    stats: {
      newInquiries: 28,
      activeInquiries: 65,
      closedInquiries: 48,
      closeToSales: 12,
      sales: 18,
      overdue: 8
    },
    statusWiseData: [
      { status: 'New', count: 20, percentage: 18 },
      { status: 'Qualified', count: 15, percentage: 14 },
      { status: 'Non-Potential', count: 8, percentage: 7 },
      { status: 'Proposal', count: 12, percentage: 11 },
      { status: 'Negotiation', count: 10, percentage: 9 },
      { status: 'Won', count: 18, percentage: 16 },
      { status: 'Lost', count: 12, percentage: 11 }
    ],
    leadTypeData: [
      { type: 'Hajj Packages', count: 25, percentage: 23 },
      { type: 'Custom Umrah', count: 20, percentage: 18 },
      { type: 'Readymade Umrah', count: 18, percentage: 16 },
      { type: 'Flights', count: 14, percentage: 13 },
      { type: 'Transfers', count: 10, percentage: 9 },
      { type: 'Visas', count: 12, percentage: 11 },
      { type: 'Hotel Booking', count: 11, percentage: 10 }
    ],
    leadSourceData: [
      { source: 'WhatsApp', count: 30, percentage: 28 },
      { source: 'FB Form', count: 15, percentage: 14 },
      { source: 'Messenger', count: 12, percentage: 11 },
      { source: 'Website Form', count: 18, percentage: 17 },
      { source: 'Website Chat', count: 10, percentage: 9 },
      { source: 'SEO', count: 12, percentage: 11 },
      { source: 'Google Ads', count: 10, percentage: 9 }
    ]
  },
  "user2": {
    stats: {
      newInquiries: 20,
      activeInquiries: 48,
      closedInquiries: 35,
      closeToSales: 9,
      sales: 14,
      overdue: 7
    },
    statusWiseData: [
      { status: 'New', count: 18, percentage: 19 },
      { status: 'Qualified', count: 12, percentage: 12 },
      { status: 'Non-Potential', count: 6, percentage: 6 },
      { status: 'Proposal', count: 10, percentage: 10 },
      { status: 'Negotiation', count: 8, percentage: 8 },
      { status: 'Won', count: 14, percentage: 14 },
      { status: 'Lost', count: 9, percentage: 9 }
    ],
    leadTypeData: [
      { type: 'Hajj Packages', count: 22, percentage: 22 },
      { type: 'Custom Umrah', count: 18, percentage: 18 },
      { type: 'Readymade Umrah', count: 14, percentage: 14 },
      { type: 'Flights', count: 12, percentage: 12 },
      { type: 'Transfers', count: 8, percentage: 8 },
      { type: 'Visas', count: 14, percentage: 14 },
      { type: 'Hotel Booking', count: 12, percentage: 12 }
    ],
    leadSourceData: [
      { source: 'WhatsApp', count: 25, percentage: 25 },
      { source: 'FB Form', count: 14, percentage: 14 },
      { source: 'Messenger', count: 10, percentage: 10 },
      { source: 'Website Form', count: 16, percentage: 16 },
      { source: 'Website Chat', count: 8, percentage: 8 },
      { source: 'SEO', count: 10, percentage: 10 },
      { source: 'Google Ads', count: 8, percentage: 8 }
    ]
  },
  "user3": {
    stats: {
      newInquiries: 15,
      activeInquiries: 32,
      closedInquiries: 28,
      closeToSales: 6,
      sales: 9,
      overdue: 4
    },
    statusWiseData: [
      { status: 'New', count: 12, percentage: 16 },
      { status: 'Qualified', count: 9, percentage: 12 },
      { status: 'Non-Potential', count: 4, percentage: 5 },
      { status: 'Proposal', count: 7, percentage: 9 },
      { status: 'Negotiation', count: 5, percentage: 7 },
      { status: 'Won', count: 9, percentage: 12 },
      { status: 'Lost', count: 7, percentage: 9 }
    ],
    leadTypeData: [
      { type: 'Hajj Packages', count: 14, percentage: 18 },
      { type: 'Custom Umrah', count: 12, percentage: 16 },
      { type: 'Readymade Umrah', count: 10, percentage: 13 },
      { type: 'Flights', count: 8, percentage: 11 },
      { type: 'Transfers', count: 6, percentage: 8 },
      { type: 'Visas', count: 12, percentage: 16 },
      { type: 'Hotel Booking', count: 9, percentage: 12 }
    ],
    leadSourceData: [
      { source: 'WhatsApp', count: 16, percentage: 22 },
      { source: 'FB Form', count: 10, percentage: 14 },
      { source: 'Messenger', count: 7, percentage: 10 },
      { source: 'Website Form', count: 12, percentage: 17 },
      { source: 'Website Chat', count: 5, percentage: 7 },
      { source: 'SEO', count: 8, percentage: 11 },
      { source: 'Google Ads', count: 6, percentage: 8 }
    ]
  }
};

// Date range specific variations - multipliers to apply to data
const dateRangeMultipliers = {
  lastWeek: {
    stats: 0.3,
    statusWise: 0.3,
    leadType: 0.3,
    leadSource: 0.3
  },
  lastMonth: {
    stats: 1,
    statusWise: 1,
    leadType: 1,
    leadSource: 1
  },
  lastQuarter: {
    stats: 3,
    statusWise: 3,
    leadType: 3,
    leadSource: 3
  },
  lastYear: {
    stats: 12,
    statusWise: 12,
    leadType: 12,
    leadSource: 12
  }
};

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

  // Stats data
  const [stats, setStats] = useState(dummyStats);
  const [statusWiseData, setStatusWiseData] = useState(dummyStatusWiseData);
  const [leadTypeData, setLeadTypeData] = useState(dummyLeadTypeData);
  const [leadSourceData, setLeadSourceData] = useState(dummyLeadSourceData);

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
          
          // Make sure branchSpecificData has the right keys
          if (userData.branch_id) {
            const branchId = userData.branch_id.toString();
            // Check if we have data for this branch
            if (branchSpecificData["branch" + branchId]) {
              setSelectedBranch("branch" + branchId);
            } else if (branchSpecificData["branch1"]) {
              // Default to first branch
              setSelectedBranch("branch1");
            }
          } else {
            // Default to first branch if no branch assigned
            setSelectedBranch("branch1");
          }
          
          // Set initial selected department if user has one
          if (userData.department_id) {
            setSelectedDepartment("dept" + userData.department_id);
          } else {
            // Default to first department
            setSelectedDepartment("dept1");
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
        const tenantId = localStorage.getItem('tenant_id');
        if (!tenantId) {
          console.error('No tenant ID found');
          return;
        }
        
        // Fetch branches
        let branchesData = [];
        try {
          branchesData = await branchService.getBranches(tenantId);
          if (!branchesData || branchesData.length === 0) {
            branchesData = dummyBranches;
          }
        } catch (error) {
          console.error('Error fetching branches:', error);
          branchesData = dummyBranches;
        }
        setBranches(branchesData);
        
        // Fetch departments
        let departmentsData = [];
        try {
          departmentsData = await departmentService.getDepartments(tenantId);
          if (!departmentsData || departmentsData.length === 0) {
            departmentsData = dummyDepartments;
          }
        } catch (error) {
          console.error('Error fetching departments:', error);
          departmentsData = dummyDepartments;
        }
        setDepartments(departmentsData);
        
        // Fetch users (using real userService)
        let usersData = [];
        try {
          // Try to fetch real users from API
          const response = await fetch(`${import.meta.env.VITE_API_URL}/users/all/`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            usersData = data.map(user => ({
              id: user.id,
              name: `${user.first_name} ${user.last_name || ''}`
            }));
            console.log('Fetched users from API:', usersData);
          } else {
            throw new Error('Failed to fetch users');
          }
        } catch (error) {
          console.error('Error fetching users, using dummy data:', error);
          // Fallback to dummy data
          usersData = dummyUsers;
        }
        
        setUsers(usersData);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setBranches(dummyBranches);
        setDepartments(dummyDepartments);
        setUsers(dummyUsers);
      }
    };

    if (user) {
      fetchData();
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
    setDateRangeType('custom');
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
      if (branch && canViewAllBranches) {
        filters.branch_id = branch;
      }
      
      if (department && canViewAllDepartments) {
        filters.department_id = department;
      }
      
      if (user) {
        filters.user_id = user;
      }
      
      console.log('Applying analytics filters:', filters);
      
      // Fetch analytics data based on active tab
      let data;
      
      switch (dateRangeType) {
        case 'last7days':
          data = await analyticsService.getLeadAnalytics(filters);
          break;
        case 'last30days':
          data = await analyticsService.getUserPerformance(filters);
          break;
        case 'last90days':
          data = await analyticsService.getSalesAnalytics(filters);
          break;
        case 'thisMonth':
          data = await analyticsService.getConversionFunnel(filters);
          break;
        case 'lastMonth':
          const lastMonth = subMonths(new Date(), 1);
          const newFrom = startOfMonth(lastMonth);
          const newTo = endOfMonth(lastMonth);
          data = await analyticsService.getLeadAnalytics({
            date_from: format(newFrom, 'yyyy-MM-dd'),
            date_to: format(newTo, 'yyyy-MM-dd'),
            date_range_type: 'custom'
          });
          break;
        default:
          data = await analyticsService.getLeadAnalytics(filters);
      }
      
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
      console.error('Error fetching analytics data:', error);
      setError(error.message || 'Failed to load analytics data');
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
          <Tab label="Lead Analytics" />
          <Tab label="User Performance" />
          <Tab label="Sales Analytics" />
          {canViewConversionMetrics && <Tab label="Conversion Funnel" />}
        </Tabs>
      </Box>
      
      {/* Tab Panels - These would display charts and metrics based on the data */}
      <TabPanel value={dateRangeType} index="leadAnalytics">
        <Typography variant="h6" gutterBottom>
          Lead Analytics
        </Typography>
        {stats ? (
          <Typography>
            Lead analytics data would be displayed here with charts and metrics.
          </Typography>
        ) : !isLoadingAnalytics && (
          <Typography color="text.secondary">
            No lead analytics data available. Try adjusting your filters.
          </Typography>
        )}
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
