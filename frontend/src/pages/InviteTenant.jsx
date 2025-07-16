import React, { useState } from "react";
import { 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  Box,
  Paper,
  CircularProgress,
  Container
} from "@mui/material";
import { Send as SendIcon } from '@mui/icons-material';
import axios from "axios";

export default function InviteTenant() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    // Basic validation
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }
    
    setSuccess("");
    setError("");
    setLoading(true);
    
    try {
      const res = await axios.post("/api/invite/tenant", {
        email,
        landlord_id: JSON.parse(localStorage.getItem("user")).id
      });
      setSuccess(res.data.message || "Invite sent successfully!");
      setEmail(""); // Clear the field after successful submission
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send invite. Please try again.");
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
            Invite Tenant
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
          
          <Box component="form" noValidate>
            <TextField
              label="Tenant Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              type="email"
              required
              autoFocus
              sx={{ mb: 2 }}
            />
            
            <Button 
              variant="contained" 
              onClick={handleInvite} 
              fullWidth 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              sx={{ 
                py: 1.5,
                borderRadius: 2,
                mt: 1
              }}
            >
              {loading ? "Sending..." : "Send Invite"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
