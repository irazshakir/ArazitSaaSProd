import { useState } from 'react';
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
  Grid
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Event as EventIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

// Dummy data for testing
const dummyEvents = [
  {
    id: 1,
    name: "Ahmad",
    clientName: "Mr Ahmad and Family",
    phone: "+923314588681",
    event: "EK-602 Flight Departure - Lahore to Dubai",
    date: "2024-04-05"
  },
  {
    id: 2,
    name: "Shahzad Taj",
    clientName: "Shahzad Taj Group",
    phone: "+923314588683",
    event: "Hotel Check-in - Swissotel Al Maqam Makkah",
    date: "2024-04-12"
  },
  {
    id: 3,
    name: "Aslam Baig",
    clientName: "Dr Aslam Baig and Family",
    phone: "+923314588683",
    event: "Pickup from Makkah Hotel to Madinah",
    date: "2024-04-15"
  },
  {
    id: 4,
    name: "Zahid Khan",
    clientName: "Zahid Khan",
    phone: "+923314588684",
    event: "Hotel Check-in - Le Meridien Madinah",
    date: "2024-04-15"
  },
  {
    id: 5,
    name: "Rashid Gohar",
    clientName: "Rashid Gohar with friends",
    phone: "+923314588685",
    event: "Pickup from Madinah Airport to Hotel",
    date: "2024-04-20"
  },
  {
    id: 6,
    name: "Ihtisham Akram",
    clientName: "Ihtisham Akram with family",
    phone: "+923314588686",
    event: "EK-604 Flight Departure - Islamabad to Dubai",
    date: "2024-04-25"
  },
  {
    id: 7,
    name: "Abdul Rehman",
    clientName: "Abdul Rehman with family",
    phone: "+923314588687",
    event: "Ziyarat Tour - Madinah",
    date: "2024-05-02"
  },
  {
    id: 8,
    name: "Shahid",
    clientName: "Shahid with family",
    phone: "+923314588688",
    event: "Hotel Check-out - Swissotel Al Maqam Makkah",
    date: "2024-05-05"
  },
  {
    id: 9,
    name: "Zaboor Ahmad",
    clientName: "Zaboor Ahmad with family",
    phone: "+923314588689",
    event: "Return Flight SV-734 - Jeddah to Lahore",
    date: "2024-05-10"
  }
];

const ReminderActivities = () => {
  const [events, setEvents] = useState(dummyEvents);
  const [timeFilter, setTimeFilter] = useState('all');

  const filterEvents = (filterType) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = dummyEvents.filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);

      switch (filterType) {
        case 'today':
          return eventDate.getTime() === today.getTime();
        case 'week': {
          const weekFromNow = new Date(today);
          weekFromNow.setDate(today.getDate() + 7);
          return eventDate >= today && eventDate <= weekFromNow;
        }
        case 'month': {
          const monthFromNow = new Date(today);
          monthFromNow.setMonth(today.getMonth() + 1);
          return eventDate >= today && eventDate <= monthFromNow;
        }
        case 'quarter': {
          const quarterFromNow = new Date(today);
          quarterFromNow.setMonth(today.getMonth() + 3);
          return eventDate >= today && eventDate <= quarterFromNow;
        }
        default:
          return true;
      }
    });

    setEvents(filtered);
  };

  const handleFilterChange = (event) => {
    const value = event.target.value;
    setTimeFilter(value);
    filterEvents(value);
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
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Upcoming Events
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
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
                    <MenuItem value="all">All Events</MenuItem>
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
                  <TableCell sx={{ fontWeight: 600 }}>Client Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Event</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.length > 0 ? (
                  events.map((event) => (
                    <TableRow
                      key={event.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {event.name}
                      </TableCell>
                      <TableCell>{event.clientName}</TableCell>
                      <TableCell>{event.phone}</TableCell>
                      <TableCell>{event.event}</TableCell>
                      <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body1" color="text.secondary">
                        No events found for the selected time period
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReminderActivities;
