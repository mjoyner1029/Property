import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

export default function TenantOnboarding() {
  const [form, setForm] = useState({
    phone: "",
    property_id: "",
    unit: "",
    lease_start: "",
    lease_end: "",
    monthly_rent: "",
    emergency_contact: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/onboard/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }
      setSuccess("Tenant onboarding complete!");
    } catch (err) {
      setError(err.message || "Failed to complete onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            borderRadius: 3
          }}
        >
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            Tenant Onboarding
          </Typography>
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="phone"
                  label="Phone"
                  variant="outlined"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="property_id"
                  label="Property ID or Invite Code"
                  variant="outlined"
                  value={form.property_id}
                  onChange={handleChange}
                  required
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="unit"
                  label="Unit Number"
                  variant="outlined"
                  value={form.unit}
                  onChange={handleChange}
                  required
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="monthly_rent"
                  label="Monthly Rent"
                  type="number"
                  variant="outlined"
                  value={form.monthly_rent}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: "$",
                    sx: { borderRadius: 2 }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="lease_start"
                  label="Lease Start"
                  type="date"
                  variant="outlined"
                  value={form.lease_start}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="lease_end"
                  label="Lease End"
                  type="date"
                  variant="outlined"
                  value={form.lease_end}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="emergency_contact"
                  label="Emergency Contact (optional)"
                  variant="outlined"
                  value={form.emergency_contact}
                  onChange={handleChange}
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    borderRadius: 2
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Submitting...
                    </>
                  ) : (
                    "Complete Onboarding"
                  )}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}