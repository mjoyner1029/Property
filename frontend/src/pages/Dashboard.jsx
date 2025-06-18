// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Grid, CircularProgress, Alert } from "@mui/material";
import axios from "axios";

export default function Dashboard() {
  const [data, setData] = useState({ tenants: 0, properties: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      axios.get("/api/tenants"),
      axios.get("/api/properties"),
      axios.get("/api/payments"),
    ])
      .then(([tenantsRes, propsRes, paymentsRes]) => {
        const pendingTotal = paymentsRes.data
          .filter(p => p.status === "pending")
          .reduce((sum, p) => sum + p.amount, 0);

        setData({
          tenants: tenantsRes.data.length,
          properties: propsRes.data.length,
          pending: pendingTotal,
        });
      })
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Total Properties</Typography>
              <Typography variant="h4">{data.properties}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Active Tenants</Typography>
              <Typography variant="h4">{data.tenants}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Pending Payments</Typography>
              <Typography variant="h4">${data.pending.toFixed(2)}</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
