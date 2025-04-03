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
  CalendarToday as CalendarTodayIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { branchService, departmentService, userService } from '../../services/api';
import { format } from 'date-fns';

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
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [dateTo, setDateTo] = useState(new Date());
  const [dateRangeType, setDateRangeType] = useState('lastMonth'); // For applying multipliers

  // Stats data
  const [stats, setStats] = useState(dummyStats);
  const [statusWiseData, setStatusWiseData] = useState(dummyStatusWiseData);
  const [leadTypeData, setLeadTypeData] = useState(dummyLeadTypeData);
  const [leadSourceData, setLeadSourceData] = useState(dummyLeadSourceData);

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

  // Determine date range type based on selected dates
  useEffect(() => {
    const daysDifference = Math.round((dateTo - dateFrom) / (1000 * 60 * 60 * 24));
    
    let newDateRangeType;
    if (daysDifference <= 7) {
      newDateRangeType = 'lastWeek';
    } else if (daysDifference <= 31) {
      newDateRangeType = 'lastMonth';
    } else if (daysDifference <= 92) {
      newDateRangeType = 'lastQuarter';
    } else {
      newDateRangeType = 'lastYear';
    }
    
    if (newDateRangeType !== dateRangeType) {
      setDateRangeType(newDateRangeType);
      // Apply filters when date range type changes
      if (user) { // Only if user is loaded
        setTimeout(() => {
          applyFilters(selectedBranch, selectedDepartment, selectedUser, dateFrom, dateTo, newDateRangeType);
        }, 100);
      }
    }
  }, [dateFrom, dateTo, dateRangeType, selectedBranch, selectedDepartment, selectedUser, user]);

  // Handle filter changes
  const handleBranchChange = (event) => {
    const branchId = event.target.value;
    setSelectedBranch(branchId);
    console.log("Selected branch changed to:", branchId);
    
    // Apply filters immediately when branch changes
    setTimeout(() => {
      applyFilters(branchId, selectedDepartment, selectedUser, dateFrom, dateTo, dateRangeType);
    }, 100);
  };
  
  const handleDepartmentChange = (event) => {
    const deptId = event.target.value;
    setSelectedDepartment(deptId);
    console.log("Selected department changed to:", deptId);
    
    // Apply filters immediately when department changes
    setTimeout(() => {
      applyFilters(selectedBranch, deptId, selectedUser, dateFrom, dateTo, dateRangeType);
    }, 100);
  };
  
  const handleUserChange = (event) => {
    const userId = event.target.value;
    setSelectedUser(userId);
    console.log("Selected user changed to:", userId);
    
    // Apply filters immediately when user changes
    setTimeout(() => {
      applyFilters(selectedBranch, selectedDepartment, userId, dateFrom, dateTo, dateRangeType);
    }, 100);
  };
  
  const handleDateFromChange = (newDate) => {
    setDateFrom(newDate);
    // Don't apply filters immediately for dates to avoid multiple updates
  };
  
  const handleDateToChange = (newDate) => {
    setDateTo(newDate);
    // Don't apply filters immediately for dates to avoid multiple updates
  };

  const applyFilters = (branch = selectedBranch, department = selectedDepartment, user = selectedUser, from = dateFrom, to = dateTo, rangeType = dateRangeType) => {
    // In a real app, this would make an API call with the selected filters
    console.log("Applying filters:", {
      branch,
      department,
      user,
      dateFrom: format(from, 'yyyy-MM-dd'),
      dateTo: format(to, 'yyyy-MM-dd'),
      rangeType
    });
    
    setIsLoading(true);
    
    // Apply dynamic data based on filters
    setTimeout(() => {
      let newStats = { ...dummyStats };
      let newStatusWiseData = [...dummyStatusWiseData];
      let newLeadTypeData = [...dummyLeadTypeData];
      let newLeadSourceData = [...dummyLeadSourceData];
      
      // Apply branch filter if selected
      if (branch && branchSpecificData[branch]) {
        console.log("Applying branch filter:", branch);
        newStats = { ...branchSpecificData[branch].stats };
        newStatusWiseData = [...branchSpecificData[branch].statusWiseData];
        newLeadTypeData = [...branchSpecificData[branch].leadTypeData];
        newLeadSourceData = [...branchSpecificData[branch].leadSourceData];
      }
      
      // Apply user filter if selected (overrides branch filter)
      if (user && userSpecificData[user]) {
        console.log("Applying user filter:", user);
        newStats = { ...userSpecificData[user].stats };
        newStatusWiseData = [...userSpecificData[user].statusWiseData];
        newLeadTypeData = [...userSpecificData[user].leadTypeData];
        newLeadSourceData = [...userSpecificData[user].leadSourceData];
      }
      
      // Apply date range multiplier
      const multiplier = dateRangeMultipliers[rangeType];
      console.log("Applying date range multiplier:", rangeType, multiplier);
      
      // Apply multiplier to stats
      Object.keys(newStats).forEach(key => {
        newStats[key] = Math.round(newStats[key] * multiplier.stats);
      });
      
      // Apply multiplier to statusWiseData and recalculate percentages
      let totalStatusCount = 0;
      newStatusWiseData = newStatusWiseData.map(item => {
        const updatedCount = Math.round(item.count * multiplier.statusWise);
        totalStatusCount += updatedCount;
        return {
          ...item,
          count: updatedCount
        };
      });
      
      newStatusWiseData = newStatusWiseData.map(item => ({
        ...item,
        percentage: Math.round((item.count / totalStatusCount) * 100)
      }));
      
      // Apply multiplier to leadTypeData and recalculate percentages
      let totalLeadTypeCount = 0;
      newLeadTypeData = newLeadTypeData.map(item => {
        const updatedCount = Math.round(item.count * multiplier.leadType);
        totalLeadTypeCount += updatedCount;
        return {
          ...item,
          count: updatedCount
        };
      });
      
      newLeadTypeData = newLeadTypeData.map(item => ({
        ...item,
        percentage: Math.round((item.count / totalLeadTypeCount) * 100)
      }));
      
      // Apply multiplier to leadSourceData and recalculate percentages
      let totalLeadSourceCount = 0;
      newLeadSourceData = newLeadSourceData.map(item => {
        const updatedCount = Math.round(item.count * multiplier.leadSource);
        totalLeadSourceCount += updatedCount;
        return {
          ...item,
          count: updatedCount
        };
      });
      
      newLeadSourceData = newLeadSourceData.map(item => ({
        ...item,
        percentage: Math.round((item.count / totalLeadSourceCount) * 100)
      }));
      
      // Update state with new data
      setStats(newStats);
      setStatusWiseData(newStatusWiseData);
      setLeadTypeData(newLeadTypeData);
      setLeadSourceData(newLeadSourceData);
      
      setIsLoading(false);
    }, 500);
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
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
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
                {stats.newInquiries}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New Inquiries
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  +12% from last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
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
                {stats.activeInquiries}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Inquiries
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  +8% from last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
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
                <Avatar sx={{ bgcolor: 'rgba(130, 76, 150, 0.1)', color: '#824c96' }}>
                  <CheckCircleIcon />
                </Avatar>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                {stats.closedInquiries}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Closed Inquiries
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  +10% from last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
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
                {stats.closeToSales}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Close to Sales
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  +15% from last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
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
                {stats.sales}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sales
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  +25% from last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
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
                {stats.overdue}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overdue
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingDownIcon sx={{ color: 'error.main', fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption" color="error.main">
                  +5% from last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Status Wise and Lead Type Tables */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Status Wise Inquiries Table */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Status Wise Inquiries
                </Typography>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Count</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Percentage</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Visual</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statusWiseData.map((row) => (
                      <TableRow key={row.status}>
                        <TableCell component="th" scope="row">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: 
                                  row.status === 'New' ? '#9d277c' :
                                  row.status === 'Qualified' ? '#c34387' :
                                  row.status === 'Non-Potential' ? '#f7a6f7' :
                                  row.status === 'Proposal' ? '#824c96' :
                                  row.status === 'Negotiation' ? '#ad5cac' :
                                  row.status === 'Won' ? '#4caf50' :
                                  '#f44336',
                                mr: 1
                              }}
                            />
                            {row.status}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                        <TableCell align="right">{row.percentage}%</TableCell>
                        <TableCell align="right">
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={row.percentage}
                              sx={{
                                height: 8,
                                borderRadius: 5,
                                bgcolor: 'rgba(0, 0, 0, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: 
                                    row.status === 'New' ? '#9d277c' :
                                    row.status === 'Qualified' ? '#c34387' :
                                    row.status === 'Non-Potential' ? '#f7a6f7' :
                                    row.status === 'Proposal' ? '#824c96' :
                                    row.status === 'Negotiation' ? '#ad5cac' :
                                    row.status === 'Won' ? '#4caf50' :
                                    '#f44336'
                                }
                              }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {statusWiseData.reduce((sum, item) => sum + item.count, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>100%</TableCell>
                      <TableCell align="right"></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Lead Type Table */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Lead Type Statistics
                </Typography>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Lead Type</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Count</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Percentage</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Visual</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leadTypeData.map((row, index) => (
                      <TableRow key={row.type}>
                        <TableCell component="th" scope="row">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: 
                                  index === 0 ? '#9d277c' :
                                  index === 1 ? '#c34387' :
                                  index === 2 ? '#f7a6f7' :
                                  index === 3 ? '#824c96' :
                                  index === 4 ? '#ad5cac' :
                                  index === 5 ? '#4caf50' :
                                  '#f44336',
                                mr: 1
                              }}
                            />
                            {row.type}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                        <TableCell align="right">{row.percentage}%</TableCell>
                        <TableCell align="right">
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={row.percentage}
                              sx={{
                                height: 8,
                                borderRadius: 5,
                                bgcolor: 'rgba(0, 0, 0, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: 
                                    index === 0 ? '#9d277c' :
                                    index === 1 ? '#c34387' :
                                    index === 2 ? '#f7a6f7' :
                                    index === 3 ? '#824c96' :
                                    index === 4 ? '#ad5cac' :
                                    index === 5 ? '#4caf50' :
                                    '#f44336'
                                }
                              }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {leadTypeData.reduce((sum, item) => sum + item.count, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>100%</TableCell>
                      <TableCell align="right"></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Lead Source Table */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={0} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Lead Source Statistics
                </Typography>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Lead Source</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Count</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Percentage</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Visual</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leadSourceData.map((row, index) => (
                      <TableRow key={row.source}>
                        <TableCell component="th" scope="row">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: 
                                  index === 0 ? '#9d277c' :
                                  index === 1 ? '#c34387' :
                                  index === 2 ? '#f7a6f7' :
                                  index === 3 ? '#824c96' :
                                  index === 4 ? '#ad5cac' :
                                  index === 5 ? '#4caf50' :
                                  '#f44336',
                                mr: 1
                              }}
                            />
                            {row.source}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                        <TableCell align="right">{row.percentage}%</TableCell>
                        <TableCell align="right">
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={row.percentage}
                              sx={{
                                height: 8,
                                borderRadius: 5,
                                bgcolor: 'rgba(0, 0, 0, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: 
                                    index === 0 ? '#9d277c' :
                                    index === 1 ? '#c34387' :
                                    index === 2 ? '#f7a6f7' :
                                    index === 3 ? '#824c96' :
                                    index === 4 ? '#ad5cac' :
                                    index === 5 ? '#4caf50' :
                                    '#f44336'
                                }
                              }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {leadSourceData.reduce((sum, item) => sum + item.count, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>100%</TableCell>
                      <TableCell align="right"></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticalReport;
