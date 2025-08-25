import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import api from '../utils/api';
import { logger } from '../utils/logger';
import LockResetIcon from '@mui/icons-material/LockReset';
import { motion } from 'framer-motion';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenChecking, setTokenChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Validate token on component mount
    if (!token) {
      setTokenChecking(false);
      setError('Invalid or missing reset token');
      return;
    }

    async function validateToken() {
      try {
        const response = await api.get(`/auth/validate-reset-token/${token}`);
        setTokenValid(true);
      } catch (err) {
        setError('This password reset link has expired or is invalid');
        logger.error('Token validation error:', err);
      } finally {
        setTokenChecking(false);
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/reset-password', { token, password });
      setIsSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
      logger.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenChecking) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          backgroundColor: '#121417'
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#121417'
      }}
    >
      <Grid container maxWidth="md" sx={{ mx: 2 }}>
        <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ p: 4 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box component="img" src="/images/logo.png" alt="Asset Anchor Logo" sx={{ width: '100%', maxWidth: 200, mb: 2 }} />
              <Typography variant="h4" color="primary.light" gutterBottom>
                Reset Your Password
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create a new secure password for your Asset Anchor account.
              </Typography>
            </motion.div>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper 
            component={motion.div}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            elevation={3} 
            sx={{ 
              p: 4, 
              backgroundColor: '#1F2327',
              borderRadius: 2
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <LockResetIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h5" color="text.primary" gutterBottom>
                Reset Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please enter your new password below
              </Typography>
            </Box>

            {!tokenValid ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : isSuccess ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Password reset successful! You will be redirected to login shortly.
              </Alert>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  margin="normal"
                  variant="outlined"
                />

                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  margin="normal"
                  variant="outlined"
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button
                    color="primary"
                    onClick={() => navigate('/login')}
                  >
                    Back to Login
                  </Button>
                </Box>
              </form>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}