import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  Grid
} from "@mui/material";
import { 
  Delete as DeleteIcon, 
  Refresh as RefreshIcon,
  PersonOff as DeactivateIcon
} from "@mui/icons-material";

const AdminDashboard = () => {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const _theme = useTheme();

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, propertiesRes, paymentsRes] = await Promise.all([
        axios.get("/api/admin/users"),
        axios.get("/api/admin/properties"),
        axios.get("/api/admin/payments"),
      ]);
      setUsers(usersRes.data);
      setProperties(propertiesRes.data);
      setPayments(paymentsRes.data);
    } catch (err) {
      console.error("Failed to load admin data", err);
      setError("Failed to load admin data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeactivate = async (userId) => {
    try {
      await axios.post(`/api/admin/deactivate_user/${userId}`);
      fetchData();
    } catch (err) {
      setError("Failed to deactivate user. Please try again.");
      console.error("Deactivation failed:", err);
    }
  };

  const handleRefund = async (paymentId) => {
    try {
      await axios.post(`/api/payments/refund/${paymentId}`);
      fetchData();
    } catch (err) {
      setError("Refund failed. Please try again.");
      console.error("Refund failed:", err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>
          Admin Dashboard
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={fetchData}
        >
          Refresh
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Users Section */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
            Users
          </Typography>
          <Paper elevation={0} sx={{ 
            boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            borderRadius: 3,
            overflow: 'hidden'
          }}>
            <List disablePadding>
              {users.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No users found" />
                </ListItem>
              ) : (
                users.map((user, i) => (
                  <React.Fragment key={user.id}>
                    <ListItem
                      secondaryAction={
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<DeactivateIcon />}
                          onClick={() => handleDeactivate(user.id)}
                        >
                          Deactivate
                        </Button>
                      }
                    >
                      <ListItemText 
                        primary={user.full_name}
                        secondary={user.role}
                      />
                    </ListItem>
                    {i < users.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Properties Section */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
            Properties
          </Typography>
          <Paper elevation={0} sx={{ 
            boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            borderRadius: 3,
            overflow: 'hidden'
          }}>
            <List disablePadding>
              {properties.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No properties found" />
                </ListItem>
              ) : (
                properties.map((property, i) => (
                  <React.Fragment key={property.id}>
                    <ListItem>
                      <ListItemText 
                        primary={property.name}
                        secondary={property.address}
                      />
                    </ListItem>
                    {i < properties.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Payments Section */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
            Payments
          </Typography>
          <Paper elevation={0} sx={{ 
            boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            borderRadius: 3,
            overflow: 'hidden'
          }}>
            <List disablePadding>
              {payments.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No payments found" />
                </ListItem>
              ) : (
                payments.map((payment, i) => (
                  <React.Fragment key={payment.id}>
                    <ListItem
                      secondaryAction={
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          startIcon={<RefreshIcon />}
                          onClick={() => handleRefund(payment.id)}
                        >
                          Refund
                        </Button>
                      }
                    >
                      <ListItemText 
                        primary={`$${payment.amount} - ${payment.status}`}
                        secondary={`User ID: ${payment.user_id}`}
                      />
                    </ListItem>
                    {i < payments.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
