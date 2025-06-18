// frontend/src/pages/Dashboard.jsx
import React from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";

export default function Dashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Total Properties</Typography>
            <Typography variant="h4">5</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Active Tenants</Typography>
            <Typography variant="h4">12</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Pending Payments</Typography>
            <Typography variant="h4">$3,200</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
