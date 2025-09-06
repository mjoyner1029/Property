import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/index';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  _Paper,
  Alert,
  CircularProgress,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Card,
  InputAdornment,
  IconButton
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import errorHandler from '../utils/errorHandler';
import logo from '../assets/logo.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [portalType, setPortalType] = useState('tenant'); // Default to tenant portal
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePortalChange = (event, newPortal) => {
    if (newPortal !== null) {
      setPortalType(newPortal);
    }
  };
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword((show) => !show);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Pass email and password as separate parameters
      const userData = await login(email, password);
      
      if (userData) {
        // For now, all successful logins redirect to dashboard
        // TODO: Add onboarding and role-specific routing later
        navigate('/dashboard');
      }
    } catch (err) {
      // Use the error handler to get a consistent error message
      const { message } = errorHandler.handleError(err, {
        showToast: true,
        fallbackMessage: 'Failed to login. Please check your credentials.'
      });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ 
        my: 5, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center'
      }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <img 
            src={logo} 
            alt="Asset Anchor Logo" 
            style={{ 
              height: '80px', 
              maxWidth: '100%' 
            }}
          />
          <Typography 
            component="h1" 
            variant="h4" 
            sx={{ 
              mt: 2, 
              fontWeight: 'bold',
              color: '#2563EB'
            }}
          >
            Asset Anchor
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Property management made simple
          </Typography>
        </Box>
        
        <Card 
          elevation={6} 
          sx={{ 
            p: 4, 
            width: '100%', 
            maxWidth: 550,
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Typography 
            component="h1" 
            variant="h5" 
            align="center" 
            sx={{ 
              mb: 3, 
              fontWeight: 600 
            }}
          >
            Sign In
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          
          <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
            Choose your portal:
          </Typography>
          
          <ToggleButtonGroup
            value={portalType}
            exclusive
            onChange={handlePortalChange}
            aria-label="portal type"
            fullWidth
            sx={{ mb: 3 }}
          >
            <ToggleButton value="tenant" aria-label="tenant portal" sx={{ py: 1 }}>
              <PersonIcon sx={{ mr: 1 }} />
              Tenant
            </ToggleButton>
            <ToggleButton value="landlord" aria-label="landlord portal" sx={{ py: 1 }}>
              <HomeIcon sx={{ mr: 1 }} />
              Landlord
            </ToggleButton>
            <ToggleButton value="admin" aria-label="admin portal" sx={{ py: 1 }}>
              <AdminPanelSettingsIcon sx={{ mr: 1 }} />
              Admin
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Divider sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Login Details
            </Typography>
          </Divider>
          
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              inputProps={{ 'aria-label': 'email' }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              inputProps={{ 'aria-label': 'password' }}
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              size="large"
              sx={{ 
                mb: 2,
                py: 1.5,
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Log In'}
            </Button>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    Forgot password?
                  </Typography>
                </Link>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    {"Don't have an account? Sign Up"}
                  </Typography>
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Card>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          © {new Date().getFullYear()} Asset Anchor. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
}

export default Login;
