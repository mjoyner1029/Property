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
import { Layout, PageHeader } from "../components";
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
  const theme = useTheme();
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
  const _theme = useTheme();
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
    // Ensure freshness on mount
    fetchRequests?.();
    fetchPayments?.();
  }, [updatePageTitle, fetchRequests, fetchPayments]);

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

  // Quick access (inline to capture hooks/vars)
  const QuickAccessCard = () => (
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
          <Box
            component="button"
            onClick={() => navigate("/dashboard/overview")}
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
            <ComputerIcon sx={{ fontSize: 28, mb: 0.5 }} />
            <Typography variant="body2">Overview</Typography>
          </Box>

          <Box
            component="button"
            onClick={() => navigate("/dashboard/calendar")}
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
            <CalendarIcon sx={{ fontSize: 28, mb: 0.5 }} />
            <Typography variant="body2">Calendar</Typography>
          </Box>

          <Box
            component="button"
            onClick={() => navigate("/properties")}
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
            <HomeIcon sx={{ fontSize: 28, mb: 0.5 }} />
            <Typography variant="body2">Rentals</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Typography color="error" variant="h6">
            Error loading dashboard data: {String(error)}
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
        <PageHeader
          title={`Hello, ${user?.firstName || "there"}!`}
          subtitle="Here's what's happening with your properties today"
          action={
            <Button variant="contained" color="primary" onClick={() => navigate("/properties/add")}>
              Add Property
            </Button>
          }
        />

        <Grid container spacing={3}>
          {/* Quick Access */}
          <Grid item xs={12} md={6}>
            <QuickAccessCard />
          </Grid>

          {/* Predictive Maintenance Chart (derived series or fallback) */}
          <Grid item xs={12} md={6}>
            <ChartCard
              title="Predictive Maintenance"
              subtitle={alertCount > 0 ? `${alertCount} Alert${alertCount > 1 ? "s" : ""}` : "No Critical Alerts"}
              data={maintenanceSeries}
              color={theme.palette.warning.main}
            />
          </Grid>

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
                    Recent Activity
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
        </Grid>
      </Box>
    </Layout>
  );
}
