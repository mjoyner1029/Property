import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Container,
  CircularProgress
} from "@mui/material";
import { Lock as LockIcon } from "@mui/icons-material";

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setMessage("");
    setError("");
    
    try {
      await axios.post(`/api/auth/reset-password/${token}`, { password });
      setMessage("Password reset successful! You can now log in with your new password.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box 
        sx={{ 
          mt: 8, 
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Paper 
          elevation={0}
          sx={{ 
            width: '100%', 
            p: 4,
            boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            borderRadius: 3
          }}
        >
          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3
            }}
          >
            <Box 
              sx={{
                backgroundColor: 'primary.main',
                borderRadius: '50%',
                p: 1,
                mb: 2
              }}
            >
              <LockIcon sx={{ color: 'white' }} />
            </Box>
            <Typography variant="h5" component="h1" fontWeight={600}>
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Enter your new password below
            </Typography>
          </Box>

          {message && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="New Password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ 
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2
                }
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ 
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2
                }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !password || !confirmPassword}
              sx={{ 
                py: 1.5,
                mb: 2,
                borderRadius: 2
              }}
            >
              {loading ? <CircularProgress size={24} /> : "Reset Password"}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Remember your password? <Link to="/login" style={{ color: 'primary.main', fontWeight: 500 }}>Log in</Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword;