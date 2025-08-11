// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Paper,
  Divider,
  useMediaQuery,
  CircularProgress
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  MoreVert as MoreVertIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  Build as BuildIcon,
  AttachMoney as MoneyIcon,
  Notifications as NotificationsIcon,
  Computer as ComputerIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import ChartCard from "../components/ChartCard";
import StatsCard from "../components/StatsCard";
import PageHeader from "../components/PageHeader";

// Mock data for charts
const maintenanceData = [
  { date: '2025-06-01', value: 35 },
  { date: '2025-06-08', value: 38 },
  { date: '2025-06-15', value: 42 },
  { date: '2025-06-22', value: 40 },
  { date: '2025-06-29', value: 45 },
  { date: '2025-07-06', value: 48 },
  { date: '2025-07-13', value: 52 }
];

const systemLogData = [
  { date: '2025-07-01', value: 42 },
  { date: '2025-07-03', value: 47 },
  { date: '2025-07-05', value: 45 },
  { date: '2025-07-07', value: 49 },
  { date: '2025-07-09', value: 53 },
  { date: '2025-07-11', value: 55 },
  { date: '2025-07-13', value: 58 }
];

// Sample activity data
const activityItems = [
  { 
    id: 1, 
    type: 'maintenance', 
    title: 'New maintenance request', 
    description: 'Kitchen sink is leaking',
    status: 'open',
    time: '2025-07-14T08:30:00Z'
  },
  { 
    id: 2, 
    type: 'payment', 
    title: 'Payment received', 
    description: '$1,200 from John Smith',
    status: 'completed',
    time: '2025-07-14T06:15:00Z'
  },
  { 
    id: 3, 
    type: 'notification', 
    title: 'New tenant application', 
    description: 'Sarah Johnson applied for Unit 304',
    time: '2025-07-13T22:45:00Z'
  },
  { 
    id: 4, 
    type: 'maintenance', 
    title: 'Maintenance completed', 
    description: 'HVAC repair in Unit 205',
    status: 'completed',
    time: '2025-07-13T16:20:00Z'
  },
];

// Custom hook for dashboard data
const useDashboardData = () => {
  // This would normally fetch from your API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    propertyStats: {
      total: 5,
      occupancyRate: 87,
      averageRent: 1425,
      maintenanceCount: 3
    },
    maintenanceStats: {
      open: 3,
      inProgress: 2,
      completed: 8,
      critical: 0
    },
    unreadNotifications: 4,
    todayActivities: 6,
    properties: []
  });
  
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setLoading(false);
      // You would normally set data from API response here
    }, 800);
  }, []);
  
  return {
    loading,
    error,
    ...data
  };
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const { 
    propertyStats, 
    maintenanceStats, 
    unreadNotifications, 
    todayActivities,
    properties,
    loading,
    error
  } = useDashboardData();
  
  const [anchorEl, setAnchorEl] = useState(null);

  // Menu handlers
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Format activity time
  const formatActivityTime = (timeStr) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get icon for activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'maintenance':
        return <BuildIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />;
      case 'payment':
        return <MoneyIcon fontSize="small" sx={{ color: theme.palette.success.main }} />;
      case 'notification':
        return <NotificationsIcon fontSize="small" sx={{ color: theme.palette.info.main }} />;
      default:
        return <WarningIcon fontSize="small" />;
    }
  };

  const QuickAccessCard = () => (
    <Card sx={{ 
      height: '100%',
      boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
      borderRadius: 3,
    }}>
      <CardContent>
        <Typography variant="h6" fontWeight={500} gutterBottom>
          Quick Access
        </Typography>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: 2, 
            justifyContent: 'space-around',
            pt: 1
          }}
        >
          <Box 
            component="button" 
            onClick={() => navigate('/dashboard/overview')}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.palette.primary.main,
              '&:hover': {
                color: theme.palette.primary.dark
              }
            }}
          >
            <ComputerIcon sx={{ fontSize: 28, mb: 0.5 }} />
            <Typography variant="body2">Overview</Typography>
          </Box>
          
          <Box 
            component="button"
            onClick={() => navigate('/dashboard/calendar')}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.palette.primary.main,
              '&:hover': {
                color: theme.palette.primary.dark
              }
            }}
          >
            <CalendarIcon sx={{ fontSize: 28, mb: 0.5 }} />
            <Typography variant="body2">Calendar</Typography>
          </Box>
          
          <Box 
            component="button"
            onClick={() => navigate('/properties')}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.palette.primary.main,
              '&:hover': {
                color: theme.palette.primary.dark
              }
            }}
          >
            <HomeIcon sx={{ fontSize: 28, mb: 0.5 }} />
            <Typography variant="body2">Rentals</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Error loading dashboard data: {error}
        </Typography>
        <Button 
          variant="outlined" 
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
      <PageHeader 
        title={`Hello, ${user?.firstName || 'there'}!`}
        subtitle="Here's what's happening with your properties today"
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/properties/add')}
          >
            Add Property
          </Button>
        }
      />
      
      <Grid container spacing={3}>
        {/* Quick Access Section */}
        <Grid item xs={12} md={6}>
          <QuickAccessCard />
        </Grid>
        
        {/* Predictive Maintenance Chart */}
        <Grid item xs={12} md={6}>
          <ChartCard 
            title="Predictive Maintenance"
            subtitle="No Critical Alerts"
            data={maintenanceData} 
            color={theme.palette.warning.main}
          />
        </Grid>
        
        {/* Alerts Card */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Alerts"
            value={maintenanceStats?.critical || 0}
            icon={<WarningIcon color="warning" />}
            trendLabel="Over Time"
          />
        </Grid>
        
        {/* System Logs Card */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="System Logs"
            value="12:25"
            icon={<TimelineIcon color="primary" />}
          />
        </Grid>
        
        {/* System Logs Chart */}
        <Grid item xs={12} md={6}>
          <ChartCard 
            title="System Logs"
            data={systemLogData} 
            color={theme.palette.primary.main}
          />
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card sx={{ 
            boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            borderRadius: 3,
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={500}>Recent Activity</Typography>
                <Button
                  variant="text"
                  onClick={() => navigate('/activity')}
                >
                  View All
                </Button>
              </Box>
              
              <List>
                {activityItems.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        <Typography variant="caption" color="text.secondary">
                          {formatActivityTime(item.time)}
                        </Typography>
                      }
                    >
                      <ListItemIcon>
                        {getActivityIcon(item.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={500}>
                            {item.title}
                          </Typography>
                        }
                        secondary={item.description}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
