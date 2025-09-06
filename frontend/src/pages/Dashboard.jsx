// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  Build as BuildIcon,
  AttachMoney as MoneyIcon,
  Notifications as NotificationsIcon,
  Computer as ComputerIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth, useApp, useMaintenance, usePayment } from "../context";
import { PageHeader } from "../components";
import ChartCard from "../components/ChartCard";
import StatsCard from "../components/StatsCard";

// Fallback demo data (only used if we can't derive anything from context)
const FALLBACK_MAINT_TS = [
  { date: "2025-06-01", value: 35 },
  { date: "2025-06-08", value: 38 },
  { date: "2025-06-15", value: 42 },
  { date: "2025-06-22", value: 40 },
  { date: "2025-06-29", value: 45 },
  { date: "2025-07-06", value: 48 },
  { date: "2025-07-13", value: 52 },
];
const FALLBACK_SYSLOG_TS = [
  { date: "2025-07-01", value: 42 },
  { date: "2025-07-03", value: 47 },
  { date: "2025-07-05", value: 45 },
  { date: "2025-07-07", value: 49 },
  { date: "2025-07-09", value: 53 },
  { date: "2025-07-11", value: 55 },
  { date: "2025-07-13", value: 58 },
];
const FALLBACK_ACTIVITY = [
  {
    id: "a1",
    type: "maintenance",
    title: "New maintenance request",
    description: "Kitchen sink is leaking",
    status: "open",
    time: "2025-07-14T08:30:00Z",
  },
  {
    id: "a2",
    type: "payment",
    title: "Payment received",
    description: "$1,200 from John Smith",
    status: "completed",
    time: "2025-07-14T06:15:00Z",
  },
  {
    id: "a3",
    type: "notification",
    title: "New tenant application",
    description: "Sarah Johnson applied for Unit 304",
    time: "2025-07-13T22:45:00Z",
  },
  {
    id: "a4",
    type: "maintenance",
    title: "Maintenance completed",
    description: "HVAC repair in Unit 205",
    status: "completed",
    time: "2025-07-13T16:20:00Z",
  },
];

// Helpers
function formatActivityTime(isoLike) {
  if (!isoLike) return "";
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffH = Math.floor((now - date) / (1000 * 60 * 60));
  return diffH < 24 ? `${diffH}h ago` : date.toLocaleDateString();
}

function dayKey(d) {
  const dt = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  if (!(dt instanceof Date) || Number.isNaN(dt)) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getActivityIcon(type, theme) {
  switch (type) {
    case "maintenance":
      return <BuildIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />;
    case "payment":
      return <MoneyIcon fontSize="small" sx={{ color: theme.palette.success.main }} />;
    case "notification":
      return <NotificationsIcon fontSize="small" sx={{ color: theme.palette.info.main }} />;
    default:
      return <WarningIcon fontSize="small" />;
  }
}

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const { user } = useAuth();
  const { updatePageTitle } = useApp();
  const {
    maintenanceRequests = [],
    loading: maintLoading,
    error: maintError,
    fetchRequests,
  } = useMaintenance();
  const {
    payments = [],
    loading: payLoading,
    error: payError,
    fetchPayments,
  } = usePayment();

  useEffect(() => {
    updatePageTitle("Dashboard");
    // Only fetch data if user is properly authenticated and loaded
    if (user?.id && fetchRequests && fetchPayments) {
      // Ensure freshness on mount
      fetchRequests?.();
      fetchPayments?.();
    }
  }, [updatePageTitle, fetchRequests, fetchPayments, user?.id]);

  const loading = Boolean(maintLoading || payLoading);
  const error = maintError || payError;

  // Build "events" from maintenance + payments to power activity + log chart
  const events = useMemo(() => {
    const maint = (maintenanceRequests || []).map((r) => ({
      id: `m-${r.id}`,
      type: "maintenance",
      title:
        r.status === "completed"
          ? "Maintenance completed"
          : r.status === "in_progress"
          ? "Maintenance in progress"
          : "Maintenance request",
      description: r.title || r.description || r.property_name || "Maintenance update",
      status: r.status,
      time: r.updated_at || r.created_at || null,
    }));
    const pmts = (payments || []).map((p) => ({
      id: `p-${p.id}`,
      type: "payment",
      title: p.status === "paid" ? "Payment received" : "Payment update",
      description:
        (p.amount != null ? `$${Number(p.amount).toFixed(2)}` : "Payment") +
        (p.tenant_name ? ` from ${p.tenant_name}` : ""),
      status: p.status,
      time: p.paid_at || p.due_date || p.created_at || null,
    }));
    return [...maint, ...pmts]
      .filter((e) => e.time)
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [maintenanceRequests, payments]);

  // Recent activity (top 10 or fallback)
  const recentActivity = useMemo(() => {
    const list = events.slice(0, 10);
    return list.length ? list : FALLBACK_ACTIVITY;
  }, [events]);

  // "Critical alerts" = emergency/high-priority or explicitly marked
  const alertCount = useMemo(() => {
    return (maintenanceRequests || []).filter(
      (r) => r.priority === "emergency" || r.priority === "high" || r.status === "critical"
    ).length;
  }, [maintenanceRequests]);

  // System Logs: build counts per day for last 7 days
  const systemLogSeries = useMemo(() => {
    const now = new Date();
    const days = [...Array(7).keys()]
      .map((i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i)));
    const counts = days.map((d) => {
      const key = dayKey(d);
      const v = events.filter((e) => dayKey(e.time) === key).length;
      return { date: key, value: v };
    });
    const total = counts.reduce((s, x) => s + x.value, 0);
    return total > 0 ? counts : FALLBACK_SYSLOG_TS;
  }, [events]);

  // Maintenance chart: events per day from maintenance requests (fallback if none)
  const maintenanceSeries = useMemo(() => {
    const now = new Date();
    const days = [...Array(7).keys()]
      .map((i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i)));
    const counts = days.map((d) => {
      const key = dayKey(d);
      const v = (maintenanceRequests || []).filter((r) => {
        const ts = r.created_at || r.updated_at;
        return dayKey(ts) === key;
      }).length;
      return { date: key, value: v };
    });
    const total = counts.reduce((s, x) => s + x.value, 0);
    return total > 0 ? counts : FALLBACK_MAINT_TS;
  }, [maintenanceRequests]);

  const systemTimeLabel = useMemo(
    () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    []
  );

  // Tenant-specific: Calculate rent due countdown
  const rentCountdown = useMemo(() => {
    if (user?.role !== 'tenant') return null;
    
    // For demo purposes, assuming rent is due on the 1st of each month
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Next rent due date (1st of next month if past current month's 1st, otherwise current month's 1st)
    let nextRentDate;
    if (today.getDate() >= 1 && today.getDate() <= 31) {
      // If we're past the 1st, next rent is due next month
      if (today.getDate() > 1) {
        nextRentDate = new Date(currentYear, currentMonth + 1, 1);
      } else {
        nextRentDate = new Date(currentYear, currentMonth, 1);
      }
    }
    
    const timeDiff = nextRentDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return {
      daysUntilDue: daysDiff,
      dueDate: nextRentDate,
      isOverdue: daysDiff < 0,
      isDueToday: daysDiff === 0,
      isDueSoon: daysDiff <= 7 && daysDiff > 0
    };
  }, [user?.role]);

  // Tenant-specific: Get maintenance requests for this tenant
  const tenantMaintenanceRequests = useMemo(() => {
    if (user?.role !== 'tenant') return [];
    // Filter maintenance requests for current tenant (when we have tenant_id field)
    return maintenanceRequests.filter(request => 
      request.tenant_id === user?.id || request.user_id === user?.id
    );
  }, [user?.role, user?.id, maintenanceRequests]);

  // Rent Countdown Card (tenant-only)
  const RentCountdownCard = () => {
    if (!rentCountdown) return null;
    
    const getCountdownColor = () => {
      if (rentCountdown.isOverdue) return theme.palette.error.main;
      if (rentCountdown.isDueToday) return theme.palette.warning.main;
      if (rentCountdown.isDueSoon) return theme.palette.warning.light;
      return theme.palette.success.main;
    };

    const getCountdownText = () => {
      if (rentCountdown.isOverdue) return `${Math.abs(rentCountdown.daysUntilDue)} days overdue`;
      if (rentCountdown.isDueToday) return 'Due today';
      return `${rentCountdown.daysUntilDue} days`;
    };

    return (
      <Card
        sx={{
          height: "100%",
          boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight={500} gutterBottom>
            Rent Payment
          </Typography>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography 
              variant="h3" 
              fontWeight={700}
              sx={{ color: getCountdownColor(), mb: 1 }}
            >
              {getCountdownText()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Due: {rentCountdown.dueDate.toLocaleDateString()}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 2 }}
              onClick={() => navigate('/payments')}
            >
              Pay Now
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Tenant Maintenance Requests Card
  const TenantMaintenanceCard = () => {
    if (user?.role !== 'tenant') return null;
    
    const openRequests = tenantMaintenanceRequests.filter(req => 
      req.status === 'open' || req.status === 'pending' || req.status === 'in_progress'
    );
    const completedRequests = tenantMaintenanceRequests.filter(req => 
      req.status === 'completed' || req.status === 'resolved'
    );

    return (
      <Card
        sx={{
          height: "100%",
          boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" fontWeight={500}>
              My Maintenance Requests
            </Typography>
            <Button variant="text" onClick={() => navigate("/maintenance")}>
              View All
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {openRequests.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Open
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {completedRequests.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </Box>
          </Box>

          {openRequests.length > 0 ? (
            <List dense>
              {openRequests.slice(0, 3).map((request, index) => (
                <ListItem key={request.id || index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <BuildIcon color="warning" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={request.title || request.description || 'Maintenance Request'}
                    secondary={`Status: ${request.status || 'pending'}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No open maintenance requests
            </Typography>
          )}
          
          <Button 
            variant="outlined" 
            fullWidth 
            onClick={() => navigate('/maintenance/new')}
            sx={{ mt: 1 }}
          >
            Submit New Request
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Quick access items based on user role
  const getQuickAccessItems = () => {
    if (user?.role === 'tenant') {
      return [
        {
          icon: <MoneyIcon sx={{ fontSize: 28, mb: 0.5 }} />,
          label: 'Pay Rent',
          path: '/payments',
        },
        {
          icon: <BuildIcon sx={{ fontSize: 28, mb: 0.5 }} />,
          label: 'Maintenance',
          path: '/maintenance',
        },
        {
          icon: <ComputerIcon sx={{ fontSize: 28, mb: 0.5 }} />,
          label: 'Account',
          path: '/settings',
        },
      ];
    } else if (user?.role === 'admin') {
      // Admin-specific items
      return [
        {
          icon: <ComputerIcon sx={{ fontSize: 28, mb: 0.5 }} />,
          label: 'System Overview',
          path: '/admin/overview',
        },
        {
          icon: <TimelineIcon sx={{ fontSize: 28, mb: 0.5 }} />,
          label: 'Analytics',
          path: '/admin/analytics',
        },
        {
          icon: <HomeIcon sx={{ fontSize: 28, mb: 0.5 }} />,
          label: 'User Management',
          path: '/admin/users',
        },
      ];
    } else {
      // Landlord items
      return [
        {
          icon: <ComputerIcon sx={{ fontSize: 28, mb: 0.5 }} />,
          label: 'Overview',
          path: '/dashboard/overview',
        },
        {
          icon: <CalendarIcon sx={{ fontSize: 28, mb: 0.5 }} />,
          label: 'Calendar',
          path: '/dashboard/calendar',
        },
        {
          icon: <HomeIcon sx={{ fontSize: 28, mb: 0.5 }} />,
          label: 'Rentals',
          path: '/properties',
        },
      ];
    }
  };

  // Quick access (inline to capture hooks/vars)
  const QuickAccessCard = () => {
    const items = getQuickAccessItems();
    
    return (
      <Card
        sx={{
          height: "100%",
          boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight={500} gutterBottom>
            Quick Access
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 2,
              justifyContent: "space-around",
              pt: 1,
            }}
          >
            {items.map((item, index) => (
              <Box
                key={index}
                component="button"
                onClick={() => navigate(item.path)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: theme.palette.primary.main,
                  "&:hover": { color: theme.palette.primary.dark },
                }}
              >
                {item.icon}
                <Typography variant="body2">{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Error loading dashboard data: {String(error)}
        </Typography>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
        <PageHeader
          title={`Hello, ${user?.firstName || user?.name || "there"}!`}
          subtitle={
            user?.role === 'tenant' 
              ? "Here's your rental information and account status"
              : user?.role === 'admin'
              ? "System overview and platform administration"
              : "Here's what's happening with your properties today"
          }
          action={
            user?.role === 'tenant' ? (
              <Button variant="contained" color="primary" onClick={() => navigate("/payments")}>
                Pay Rent
              </Button>
            ) : user?.role === 'admin' ? (
              <Button variant="contained" color="primary" onClick={() => navigate("/admin/users")}>
                Manage Users
              </Button>
            ) : (
              <Button variant="contained" color="primary" onClick={() => navigate("/properties/add")}>
                Add Property
              </Button>
            )
          }
        />

        <Grid container spacing={3}>
          {/* Quick Access */}
          <Grid item xs={12} md={6}>
            <QuickAccessCard />
          </Grid>

          {/* Tenant-specific: Rent Countdown */}
          {user?.role === 'tenant' && (
            <Grid item xs={12} md={6}>
              <RentCountdownCard />
            </Grid>
          )}

          {/* Admin-specific: System Overview */}
          {user?.role === 'admin' && (
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: "100%",
                  boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={500} gutterBottom>
                    Platform Overview
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={600} color="primary.main">
                          {/* Mock data - replace with real metrics */}
                          47
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Users
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={600} color="success.main">
                          23
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Properties
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={600} color="warning.main">
                          12
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Active Landlords
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={600} color="info.main">
                          32
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Active Tenants
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Landlord-specific: Predictive Maintenance Chart */}
          {user?.role === 'landlord' && (
            <Grid item xs={12} md={6}>
              <ChartCard
                title="Predictive Maintenance"
                subtitle={alertCount > 0 ? `${alertCount} Alert${alertCount > 1 ? "s" : ""}` : "No Critical Alerts"}
                data={maintenanceSeries}
                color={theme.palette.warning.main}
              />
            </Grid>
          )}

          {/* Admin-specific: System Health Chart */}
          {user?.role === 'admin' && (
            <Grid item xs={12} md={6}>
              <ChartCard
                title="System Health"
                subtitle="Platform Performance Metrics"
                data={systemLogSeries}
                color={theme.palette.primary.main}
              />
            </Grid>
          )}

          {/* Tenant-specific: Maintenance Requests */}
          {user?.role === 'tenant' && (
            <Grid item xs={12}>
              <TenantMaintenanceCard />
            </Grid>
          )}

          {/* Admin-specific: Platform Stats */}
          {user?.role === 'admin' && (
            <>
              {/* Total Revenue */}
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard
                  title="Total Revenue"
                  value="$125,430"
                  icon={<MoneyIcon color="success" />}
                  trendLabel="This Month"
                />
              </Grid>

              {/* Support Tickets */}
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard
                  title="Support Tickets"
                  value={5}
                  icon={<WarningIcon color="warning" />}
                  trendLabel="Open"
                />
              </Grid>

              {/* System Uptime */}
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard 
                  title="System Uptime" 
                  value="99.9%" 
                  icon={<TimelineIcon color="success" />} 
                  trendLabel="30 Days"
                />
              </Grid>

              {/* Active Sessions */}
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard 
                  title="Active Sessions" 
                  value={systemTimeLabel} 
                  icon={<ComputerIcon color="primary" />} 
                  trendLabel="Current"
                />
              </Grid>

              {/* User Activity Chart */}
              <Grid item xs={12} md={6}>
                <ChartCard 
                  title="User Activity" 
                  subtitle="Daily Active Users"
                  data={systemLogSeries} 
                  color={theme.palette.info.main} 
                />
              </Grid>

              {/* Revenue Chart */}
              <Grid item xs={12} md={6}>
                <ChartCard 
                  title="Platform Revenue" 
                  subtitle="Monthly Revenue Trends"
                  data={maintenanceSeries} 
                  color={theme.palette.success.main} 
                />
              </Grid>

              {/* Admin System Activity */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography variant="h6" fontWeight={500}>
                        System Activity
                      </Typography>
                      <Button variant="text" onClick={() => navigate("/admin/logs")}>
                        View Audit Logs
                      </Button>
                    </Box>

                    <List>
                      {[
                        {
                          id: "s1",
                          type: "notification",
                          title: "New user registration",
                          description: "sarah.johnson@email.com created account",
                          time: "2025-09-05T14:30:00Z",
                        },
                        {
                          id: "s2",
                          type: "payment",
                          title: "Payment processed",
                          description: "$1,200 monthly rent - Unit 304",
                          status: "completed",
                          time: "2025-09-05T12:15:00Z",
                        },
                        {
                          id: "s3",
                          type: "maintenance",
                          title: "Maintenance request closed",
                          description: "HVAC repair completed - Unit 205",
                          status: "completed",
                          time: "2025-09-05T10:20:00Z",
                        },
                        {
                          id: "s4",
                          type: "notification",
                          title: "System backup completed",
                          description: "Daily database backup successful",
                          status: "completed",
                          time: "2025-09-05T02:00:00Z",
                        },
                      ].map((item, index) => (
                        <React.Fragment key={item.id || `${item.type}-${index}`}>
                          {index > 0 && <Divider component="li" />}
                          <ListItem
                            alignItems="flex-start"
                            secondaryAction={
                              <Typography variant="caption" color="text.secondary">
                                {formatActivityTime(item.time)}
                              </Typography>
                            }
                          >
                            <ListItemIcon>{getActivityIcon(item.type, theme)}</ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {item.title}
                                  </Typography>
                                  {item.status && (
                                    <Chip
                                      size="small"
                                      label={String(item.status).replace(/_/g, " ")}
                                      color={
                                        item.status === "completed"
                                          ? "success"
                                          : item.status === "open"
                                          ? "warning"
                                          : item.status === "overdue" || item.status === "critical"
                                          ? "error"
                                          : "default"
                                      }
                                      sx={{ height: 20 }}
                                    />
                                  )}
                                </Box>
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
            </>
          )}

          {/* Landlord-specific: Stats and Charts */}
          {user?.role === 'landlord' && (
            <>
              {/* Alerts */}
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard
                  title="Alerts"
                  value={alertCount}
                  icon={<WarningIcon color="warning" />}
                  trendLabel="Active"
                />
              </Grid>

              {/* System Logs (time label is dynamic) */}
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard title="System Logs" value={systemTimeLabel} icon={<TimelineIcon color="primary" />} />
              </Grid>

              {/* System Logs Chart */}
              <Grid item xs={12} md={6}>
                <ChartCard title="System Logs" data={systemLogSeries} color={theme.palette.primary.main} />
              </Grid>

              {/* Recent Activity */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography variant="h6" fontWeight={500}>
                        Recent Property Activity
                      </Typography>
                      <Button variant="text" onClick={() => navigate("/activity")}>
                        View All
                      </Button>
                    </Box>

                    <List>
                      {recentActivity.map((item, index) => (
                        <React.Fragment key={item.id || `${item.type}-${index}`}>
                          {index > 0 && <Divider component="li" />}
                          <ListItem
                            alignItems="flex-start"
                            secondaryAction={
                              <Typography variant="caption" color="text.secondary">
                                {formatActivityTime(item.time)}
                              </Typography>
                            }
                          >
                            <ListItemIcon>{getActivityIcon(item.type, theme)}</ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {item.title}
                                  </Typography>
                                  {item.status && (
                                    <Chip
                                      size="small"
                                      label={String(item.status).replace(/_/g, " ")}
                                      color={
                                        item.status === "completed"
                                          ? "success"
                                          : item.status === "open"
                                          ? "warning"
                                          : item.status === "overdue" || item.status === "critical"
                                          ? "error"
                                          : "default"
                                      }
                                      sx={{ height: 20 }}
                                    />
                                  )}
                                </Box>
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
            </>
          )}
        </Grid>
    </Box>
  );
}
