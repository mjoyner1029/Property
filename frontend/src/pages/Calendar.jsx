// frontend/src/pages/Calendar.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  AttachMoney as PaymentIcon,
  Build as MaintenanceIcon,
  Home as PropertyIcon,
  Person as TenantIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

// Calendar helper functions
const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Mock events data
const mockEvents = [
  {
    id: 1,
    type: 'payment',
    title: 'Rent Due - 123 Main St',
    date: new Date(2025, 7, 1),
    amount: 1500,
    property: '123 Main St',
    tenant: 'John Doe',
    status: 'pending'
  },
  {
    id: 2,
    type: 'payment',
    title: 'Rent Due - 456 Oak Ave',
    date: new Date(2025, 7, 1),
    amount: 1200,
    property: '456 Oak Ave',
    tenant: 'Jane Smith',
    status: 'pending'
  },
  {
    id: 3,
    type: 'maintenance',
    title: 'Plumbing Repair',
    date: new Date(2025, 7, 5),
    property: '123 Main St',
    description: 'Fix leaking kitchen sink',
    status: 'scheduled'
  },
  {
    id: 4,
    type: 'maintenance',
    title: 'HVAC Service',
    date: new Date(2025, 7, 12),
    property: '456 Oak Ave',
    description: 'Regular maintenance of AC unit',
    status: 'scheduled'
  },
  {
    id: 5,
    type: 'lease',
    title: 'Lease Renewal',
    date: new Date(2025, 7, 15),
    property: '123 Main St',
    tenant: 'John Doe',
    status: 'pending'
  },
  {
    id: 6,
    type: 'inspection',
    title: 'Property Inspection',
    date: new Date(2025, 7, 20),
    property: '456 Oak Ave',
    description: 'Annual property inspection',
    status: 'scheduled'
  },
];

const Calendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState(mockEvents);
  const [loading, setLoading] = useState(false);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInCurrentMonth = daysInMonth(currentMonth, currentYear);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === currentMonth && 
             eventDate.getFullYear() === currentYear;
    });
  };

  const handleDayClick = (day) => {
    const dayEvents = getEventsForDay(day);
    if (dayEvents.length === 1) {
      // If only one event, show it directly
      setSelectedEvent(dayEvents[0]);
    } else if (dayEvents.length > 1) {
      // If multiple events, show the first and allow navigation
      setSelectedEvent(dayEvents[0]);
    }
  };

  const handleCloseEventDialog = () => {
    setSelectedEvent(null);
  };

  const renderCalendar = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<Box key={`empty-${i}`} sx={{ p: 2, borderBottom: '1px solid #eee', borderRight: '1px solid #eee' }}></Box>);
    }

    // Add cells for days in the month
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const eventsForDay = getEventsForDay(day);
      const isToday = 
        day === new Date().getDate() && 
        currentMonth === new Date().getMonth() && 
        currentYear === new Date().getFullYear();

      days.push(
        <Box 
          key={day} 
          onClick={() => eventsForDay.length > 0 && handleDayClick(day)}
          sx={{ 
            p: 1, 
            minHeight: '100px',
            borderBottom: '1px solid #eee', 
            borderRight: '1px solid #eee',
            backgroundColor: isToday ? 'action.hover' : 'transparent',
            cursor: eventsForDay.length > 0 ? 'pointer' : 'default',
            '&:hover': eventsForDay.length > 0 ? { bgcolor: 'action.selected' } : {}
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: isToday ? 'bold' : 'regular',
              color: isToday ? 'primary.main' : 'text.primary',
              mb: 1 
            }}
          >
            {day}
          </Typography>
          
          {eventsForDay.map((event, idx) => (
            <Box 
              key={event.id} 
              sx={{ 
                p: 0.5, 
                mb: 0.5, 
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 
                  event.type === 'payment' ? 'success.light' : 
                  event.type === 'maintenance' ? 'warning.light' : 
                  event.type === 'lease' ? 'info.light' : 'primary.light',
              }}
            >
              {event.type === 'payment' && <PaymentIcon fontSize="small" sx={{ mr: 0.5 }} />}
              {event.type === 'maintenance' && <MaintenanceIcon fontSize="small" sx={{ mr: 0.5 }} />}
              {event.type === 'lease' && <TenantIcon fontSize="small" sx={{ mr: 0.5 }} />}
              {event.type === 'inspection' && <PropertyIcon fontSize="small" sx={{ mr: 0.5 }} />}
              <Typography variant="caption" noWrap sx={{ maxWidth: '100%', display: 'block' }}>
                {event.title}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }

    return days;
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'payment': return <PaymentIcon sx={{ color: 'success.main' }} />;
      case 'maintenance': return <MaintenanceIcon sx={{ color: 'warning.main' }} />;
      case 'lease': return <TenantIcon sx={{ color: 'info.main' }} />;
      case 'inspection': return <PropertyIcon sx={{ color: 'primary.main' }} />;
      default: return null;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <PageHeader title="Calendar" />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={goToPreviousMonth}>
                <ChevronLeft />
              </IconButton>
              <Typography variant="h6" sx={{ mx: 2 }}>
                {`${months[currentMonth]} ${currentYear}`}
              </Typography>
              <IconButton onClick={goToNextMonth}>
                <ChevronRight />
              </IconButton>
            </Box>
            <Button variant="outlined" onClick={goToToday}>Today</Button>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid #eee', borderLeft: '1px solid #eee' }}>
            {/* Week day headers */}
            {weekdays.map((weekday) => (
              <Box key={weekday} sx={{ p: 1, bgcolor: 'action.hover', borderBottom: '1px solid #eee', borderRight: '1px solid #eee', textAlign: 'center' }}>
                <Typography variant="subtitle2">{weekday}</Typography>
              </Box>
            ))}
            
            {/* Calendar days */}
            {renderCalendar()}
          </Box>
        </Paper>
      )}

      {/* Event Details Dialog */}
      <Dialog open={Boolean(selectedEvent)} onClose={handleCloseEventDialog} maxWidth="sm" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
              {getEventIcon(selectedEvent.type)}
              <Typography variant="h6" sx={{ ml: 1 }}>
                {selectedEvent.title}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Date:</Typography>
                  <Typography variant="body1">
                    {selectedEvent.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Property:</Typography>
                  <Typography variant="body1">{selectedEvent.property}</Typography>
                </Grid>
                {selectedEvent.tenant && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Tenant:</Typography>
                    <Typography variant="body1">{selectedEvent.tenant}</Typography>
                  </Grid>
                )}
                {selectedEvent.amount && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Amount:</Typography>
                    <Typography variant="body1">${selectedEvent.amount}</Typography>
                  </Grid>
                )}
                {selectedEvent.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Description:</Typography>
                    <Typography variant="body1">{selectedEvent.description}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Status:</Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 
                        selectedEvent.status === 'completed' ? 'success.main' :
                        selectedEvent.status === 'pending' ? 'warning.main' :
                        'info.main',
                      textTransform: 'capitalize'
                    }}
                  >
                    {selectedEvent.status}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              {selectedEvent.type === 'payment' && (
                <Button variant="contained" color="success">Record Payment</Button>
              )}
              {selectedEvent.type === 'maintenance' && (
                <Button variant="contained" color="primary">Update Status</Button>
              )}
              <Button onClick={handleCloseEventDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Calendar;
