import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Container
} from "@mui/material";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    
    try {
      await axios.post("/api/auth/forgot-password", { email });
      setMessage("Password reset email sent! Please check your inbox.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email. Please try again.");
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
            Forgot Password
          </Typography>

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
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ 
                py: 1.5,
                mb: 2,
                borderRadius: 2
              }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            
            <Box sx={{ 
              mt: 2, 
              display: 'flex', 
              justifyContent: 'center' 
            }}>
              <Link to="/login" style={{ 
                textDecoration: 'none', 
                color: 'primary.main' 
              }}>
                <Typography color="primary">
                  Return to Login
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;