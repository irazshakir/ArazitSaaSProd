import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Event as EventIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import api from '../../services/api';
import dayjs from 'dayjs';
import { message } from 'antd';
import EnhancedPagination from '../universalComponents/enhancedPagination';

const ReminderActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tenantId = user.tenant_id;

  useEffect(() => {
    fetchActivities();
  }, [timeFilter, page, rowsPerPage, searchQuery]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Construct the API URL with filters
      let url = '/lead-activities/?';
      
      // Add tenant filter
      if (tenantId) {
        url += `tenant=${tenantId}&`;
      }
      
      // Add pagination parameters
      url += `page=${page}&page_size=${rowsPerPage}&`;
      
      // Add ordering by due_date
      url += `ordering=due_date&`;
      
      // Add time filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (timeFilter !== 'all') {
        const endDate = new Date();
        
        switch (timeFilter) {
          case 'today':
            endDate.setHours(23, 59, 59, 999);
            url += `due_date_after=${today.toISOString()}&due_date_before=${endDate.toISOString()}`;
            break;
          case 'week': {
            const weekFromNow = new Date(today);
            weekFromNow.setDate(today.getDate() + 7);
            url += `due_date_after=${today.toISOString()}&due_date_before=${weekFromNow.toISOString()}`;
            break;
          }
          case 'month': {
            const monthFromNow = new Date(today);
            monthFromNow.setMonth(today.getMonth() + 1);
            url += `due_date_after=${today.toISOString()}&due_date_before=${monthFromNow.toISOString()}`;
            break;
          }
          case 'quarter': {
            const quarterFromNow = new Date(today);
            quarterFromNow.setMonth(today.getMonth() + 3);
            url += `due_date_after=${today.toISOString()}&due_date_before=${quarterFromNow.toISOString()}`;
            break;
          }
        }
      }

      const response = await api.get(url);
      let activitiesData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setTotalItems(response.data.count || activitiesData.length);
      
      // Fetch lead details for each activity
      const activitiesWithLeadDetails = await Promise.all(
        activitiesData.map(async (activity) => {
          try {
            const leadResponse = await api.get(`/leads/${activity.lead}/`);
            const leadData = leadResponse.data;
            
            // Filter based on search query if present
            if (searchQuery) {
              const searchLower = searchQuery.toLowerCase();
              const nameMatch = leadData.name?.toLowerCase().includes(searchLower);
              const phoneMatch = leadData.phone?.toLowerCase().includes(searchLower);
              
              if (!nameMatch && !phoneMatch) {
                return null;
              }
            }
            
            return {
              ...activity,
              leadDetails: leadData
            };
          } catch (error) {
            console.error(`Error fetching lead details for activity ${activity.id}:`, error);
            return {
              ...activity,
              leadDetails: { name: 'Unknown', phone: 'Unknown' }
            };
          }
        })
      );

      // Filter out null values (non-matching search results)
      const filteredActivities = activitiesWithLeadDetails.filter(activity => activity !== null);
      setActivities(filteredActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      message.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const value = event.target.value;
    setTimeFilter(value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page when search changes
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(1); // Reset to first page when rows per page changes
  };

  return (
    <Box>
      {/* Title Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Event Reminders
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Track and manage your upcoming events and activities.
        </Typography>
      </Box>

      {/* Events Table */}
      <Card elevation={0} sx={{ borderRadius: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Upcoming Activities
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="time-filter-label">
                    <FilterListIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Time Period
                  </InputLabel>
                  <Select
                    labelId="time-filter-label"
                    value={timeFilter}
                    label="Time Period"
                    onChange={handleFilterChange}
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
                    <MenuItem value="all">All Activities</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">Next 7 Days</MenuItem>
                    <MenuItem value="month">Next 30 Days</MenuItem>
                    <MenuItem value="quarter">Next 90 Days</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
          <Divider sx={{ mb: 2 }} />

          <TableContainer component={Paper} elevation={0}>
            <Table sx={{ minWidth: 650 }} size="medium">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={40} sx={{ color: '#9d277c' }} />
                    </TableCell>
                  </TableRow>
                ) : activities.length > 0 ? (
                  activities.map((activity) => (
                    <TableRow
                      key={activity.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {activity.leadDetails?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{activity.leadDetails?.phone || 'Unknown'}</TableCell>
                      <TableCell>{activity.description}</TableCell>
                      <TableCell>
                        {activity.due_date ? dayjs(activity.due_date).format('DD/MMM/YYYY HH:mm') : 'No due date'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body1" color="text.secondary">
                        No activities found for the selected time period
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {!loading && activities.length > 0 && (
            <EnhancedPagination
              totalItems={totalItems}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReminderActivities;
