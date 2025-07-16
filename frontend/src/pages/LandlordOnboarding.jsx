import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Container,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LandlordOnboarding = () => {
  const [form, setForm] = useState({ phone: '', company: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch('/api/onboard/landlord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }
      setSuccess(true);
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (e) {
      setError(e.message || 'Submission error');
      console.error('Submission error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        mt: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            width: '100%',
            boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            borderRadius: 3
          }}
        >
          <Typography variant="h5" component="h1" fontWeight={600} sx={{ mb: 3 }}>
            Landlord Onboarding
          </Typography>
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Onboarding complete! Redirecting to your dashboard...
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              name="phone"
              label="Phone Number"
              value={form.phone}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              type="tel"
              autoFocus
              sx={{ mb: 2 }}
            />
            
            <TextField
              name="company"
              label="Company (Optional)"
              value={form.company}
              onChange={handleChange}
              fullWidth
              margin="normal"
              sx={{ mb: 3 }}
            />
            
            <Button 
              type="submit"
              variant="contained" 
              fullWidth 
              disabled={loading}
              sx={{ 
                py: 1.5,
                borderRadius: 2,
                mt: 1
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Complete Onboarding"
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LandlordOnboarding;
