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
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  BarChart as BarChartIcon,
  MonetizationOn as MonetizationOnIcon,
  FilterAlt as FilterAltIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { branchService, departmentService, userService } from '../../services/api';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import analyticsService, { hasFeatureAccess } from '../../services/analyticsService';
import { getUser, getUserRole } from '../../utils/auth';
import { TabContext, TabList, TabPanel } from '@mui/lab';

const AnalyticalReport = () => {
  // All useState and other code remains the same...
  // ...
  
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
      
      {/* All other sections remain the same... */}
      
      {/* Analytics Tabs */}
      <Box sx={{ mb: 4 }}>
        <TabContext value={dateRangeType}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList
              onChange={handleTabChange}
              aria-label="analytics tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                label="Lead Analytics"
                value="leadAnalytics"
                icon={<AssignmentIcon />}
                iconPosition="start"
              />
              <Tab
                label="Sales Analytics"
                value="salesAnalytics"
                icon={<MonetizationOnIcon />}
                iconPosition="start"
              />
              <Tab
                label="Conversion Funnel"
                value="conversionFunnel"
                icon={<FilterAltIcon />}
                iconPosition="start"
              />
              <Tab
                label="User Performance"
                value="userPerformance"
                icon={<PersonIcon />}
                iconPosition="start"
              />
            </TabList>
          </Box>
          
          <TabPanel value="leadAnalytics" index="leadAnalytics">
            <Box>
              {/* Lead Analytics content */}
              <Typography>Lead Analytics Content</Typography>
            </Box>
          </TabPanel>
          
          <TabPanel value="salesAnalytics" index="salesAnalytics">
            <Box>
              {/* Sales Analytics content */}
              <Typography>Sales Analytics Content</Typography>
            </Box>
          </TabPanel>
          
          <TabPanel value="conversionFunnel" index="conversionFunnel">
            <Box>
              {/* Conversion Funnel content */}
              <Typography>Conversion Funnel Content</Typography>
            </Box>
          </TabPanel>
          
          <TabPanel value="userPerformance" index="userPerformance">
            <Box>
              {/* User Performance content */}
              <Typography>User Performance Content</Typography>
            </Box>
          </TabPanel>
        </TabContext>
      </Box>
    </Box>
  );
};

export default AnalyticalReport; 