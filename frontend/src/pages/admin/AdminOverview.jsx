// frontend/src/pages/admin/AdminOverview.jsx
import React, { useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  People as PeopleIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Computer as ComputerIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth, useApp } from "../../context";
import { PageHeader } from "../../components";
import StatsCard from "../../components/StatsCard";
import ChartCard from "../../components/ChartCard";

// Mock data for admin overview
const PLATFORM_STATS = [
  { metric: "Total Users", value: 47, trend: "+12%", color: "primary" },
  { metric: "Active Properties", value: 23, trend: "+8%", color: "success" },
  { metric: "Monthly Revenue", value: "$125,430", trend: "+15%", color: "success" },
  { metric: "Support Tickets", value: 5, trend: "-3", color: "warning" },
];

const RECENT_REGISTRATIONS = [
  { name: "Sarah Johnson", email: "sarah.j@email.com", role: "tenant", date: "2025-09-05" },
  { name: "Mike Chen", email: "mike.chen@email.com", role: "landlord", date: "2025-09-04" },
  { name: "Emily Davis", email: "emily.d@email.com", role: "tenant", date: "2025-09-03" },
  { name: "Robert Wilson", email: "robert.w@email.com", role: "landlord", date: "2025-09-02" },
];

const REVENUE_DATA = [
  { date: "2025-08-01", value: 95000 },
  { date: "2025-08-08", value: 102000 },
  { date: "2025-08-15", value: 98000 },
  { date: "2025-08-22", value: 110000 },
  { date: "2025-08-29", value: 125430 },
];

export default function AdminOverview() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updatePageTitle } = useApp();

  useEffect(() => {
    updatePageTitle("Admin Overview");
  }, [updatePageTitle]);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    navigate('/');
    return null;
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
      <PageHeader
        title="System Overview"
        subtitle="Platform administration and monitoring"
        action={
          <Button variant="contained" color="primary" onClick={() => navigate("/admin/users")}>
            Manage Users
          </Button>
        }
      />

      <Grid container spacing={3}>
        {/* Platform Stats */}
        {PLATFORM_STATS.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatsCard
              title={stat.metric}
              value={stat.value}
              icon={
                stat.metric.includes("Users") ? (
                  <PeopleIcon color={stat.color} />
                ) : stat.metric.includes("Properties") ? (
                  <HomeIcon color={stat.color} />
                ) : stat.metric.includes("Revenue") ? (
                  <MoneyIcon color={stat.color} />
                ) : (
                  <WarningIcon color={stat.color} />
                )
              }
              trendLabel={stat.trend}
            />
          </Grid>
        ))}

        {/* Revenue Chart */}
        <Grid item xs={12} md={8}>
          <ChartCard
            title="Platform Revenue"
            subtitle="Monthly revenue trends across all properties"
            data={REVENUE_DATA}
            color={theme.palette.success.main}
          />
        </Grid>

        {/* System Health */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: "100%",
              boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={500} gutterBottom>
                System Health
              </Typography>
              <Box sx={{ textAlign: "center", py: 2 }}>
                <CircularProgress
                  variant="determinate"
                  value={99.9}
                  size={80}
                  thickness={4}
                  sx={{
                    color: theme.palette.success.main,
                    mb: 2,
                  }}
                />
                <Typography variant="h4" fontWeight={600} color="success.main">
                  99.9%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Uptime (30 days)
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label="All Systems Operational"
                    color="success"
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent User Registrations */}
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
                  Recent User Registrations
                </Typography>
                <Button variant="text" onClick={() => navigate("/admin/users")}>
                  View All Users
                </Button>
              </Box>

              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Registration Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {RECENT_REGISTRATIONS.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            color={
                              user.role === "admin"
                                ? "error"
                                : user.role === "landlord"
                                ? "primary"
                                : "default"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{user.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
