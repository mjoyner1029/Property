// frontend/src/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const redirectTo = loc.state?.from?.pathname || '/dashboard';

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
      logger.info('Logged in');
      nav(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Sign in
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={onSubmit}>
          <TextField
            label="Email"
            type="email" 
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={submitting}
            sx={{ mt: 3, mb: 2 }}
          >
            {submitting ? <CircularProgress size={24} /> : 'Sign in'}
          </Button>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link to="/forgot-password">
              <Typography variant="body2">Forgot password?</Typography>
            </Link>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link to="/register">
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
