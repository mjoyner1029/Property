import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
  Paper,
  Divider,
  Switch,
  Alert,
  Snackbar,
  Grid
} from "@mui/material";
import { Save as SaveIcon, Notifications as NotificationsIcon, Security as SecurityIcon } from "@mui/icons-material";

const Settings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [appNotifications, setAppNotifications] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const handlePasswordChange = () => {
    // Reset error
    setPasswordError("");
    
    // Basic validation
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    // Here you would call your API to change the password
    console.log("Password change requested:", password);
    
    // Show success message
    setSuccessMessage("Password changed successfully");
    
    // Reset form
    setPassword("");
    setConfirmPassword("");
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }} component="h1" role="heading" aria-level="1">
          Settings
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                mb: 3,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                borderRadius: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600} component="h2" role="heading" aria-level="2">
                  Notification Preferences
                </Typography>
              </Box>
              
              <FormGroup role="group" aria-label="notification settings">
                <FormControlLabel
                  control={
                    <Switch 
                      checked={emailNotifications} 
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      color="primary"
                      aria-checked={emailNotifications}
                      aria-label="email notifications"
                      role="switch"
                    />
                  }
                  label="Email Notifications"
                  data-testid="email-notifications"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={smsNotifications} 
                      onChange={(e) => setSmsNotifications(e.target.checked)}
                      color="primary"
                      aria-checked={smsNotifications}
                      aria-label="sms notifications"
                      role="switch"
                    />
                  }
                  label="SMS Notifications"
                  data-testid="sms-notifications"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={appNotifications} 
                      onChange={(e) => setAppNotifications(e.target.checked)}
                      color="primary"
                      aria-checked={appNotifications}
                      aria-label="app notifications"
                      role="switch"
                    />
                  }
                  label="In-App Notifications"
                  data-testid="app-notifications"
                />
              </FormGroup>
              
              <Box sx={{ mt: 3 }}>
                <Button 
                  variant="contained" 
                  startIcon={<SaveIcon />}
                  sx={{ borderRadius: 2 }}
                  aria-label="save preferences"
                >
                  Save Preferences
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                borderRadius: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600} component="h2" role="heading" aria-level="2">
                  Security Settings
                </Typography>
              </Box>
              
              {passwordError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {passwordError}
                </Alert>
              )}
              
                <TextField
                fullWidth
                type="password"
                label="New Password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                id="new-password"
                aria-label="New Password"
                inputProps={{
                  'aria-label': 'New Password'
                }}
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
                data-testid="new-password"
              />              <TextField
                fullWidth
                type="password"
                label="Confirm Password"
                variant="outlined"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                id="confirm-password"
                aria-label="Confirm Password"
                inputProps={{
                  'aria-label': 'Confirm Password'
                }}
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
                data-testid="confirm-password"
              />
              
              <Box sx={{ mt: 3 }}>
                <Button 
                  variant="contained" 
                  onClick={handlePasswordChange}
                  disabled={!password || !confirmPassword}
                  sx={{ borderRadius: 2 }}
                  aria-label="change password"
                >
                  Change Password
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                borderRadius: 3
              }}
            >
              <Typography variant="h6" fontWeight={600} component="h2" role="heading" aria-level="2">
                Appearance
              </Typography>
              
              <FormGroup role="group" aria-label="appearance settings">
                <FormControlLabel
                  control={
                    <Switch 
                      checked={darkMode} 
                      onChange={(e) => setDarkMode(e.target.checked)}
                      color="primary"
                      aria-checked={darkMode}
                      inputProps={{
                        'aria-label': 'dark mode'
                      }}
                      role="switch"
                    />
                  }
                  label="Dark Mode"
                />
              </FormGroup>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage("")}
        message={successMessage}
      />
    </Container>
  );
};

export default Settings;