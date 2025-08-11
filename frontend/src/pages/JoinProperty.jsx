import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  Box,
  Paper,
  Container,
  CircularProgress
} from "@mui/material";

const JoinProperty = () => {
  const [code, setCode] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError("Please enter an invite code");
      return;
    }
    
    setSuccess("");
    setError("");
    setLoading(true);
    
    try {
      await axios.post(`/api/properties/invite/${code}`, {
        user_id: user.id,
      });
      setSuccess("Successfully joined property!");
      setCode(""); // Clear the field after successful submission
    } catch (err) {
      setError(err.response?.data?.error || "Failed to join property. Invalid code or expired invitation.");
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
            Join Property
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
              label="Invite Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              fullWidth
              margin="normal"
              required
              autoFocus
              placeholder="Enter property invite code"
              sx={{ mb: 2 }}
            />
            
            <Button 
              variant="contained" 
              onClick={handleSubmit} 
              fullWidth 
              disabled={loading}
              sx={{ 
                py: 1.5,
                borderRadius: 2,
                mt: 1
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Join Property"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default JoinProperty;