import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Alert,
  Avatar
} from "@mui/material";
import { Person as PersonIcon } from "@mui/icons-material";

const Profile = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [name, setName] = useState(user.full_name || "");
  const [email, setEmail] = useState(user.email || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      // Update user in local storage (in a real app, this would come from the API)
      const updatedUser = { ...user, full_name: name, email };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      setMessage("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 4 }}>
          My Profile
        </Typography>
        
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3,
            boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            borderRadius: 3
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'primary.main',
                mb: 2
              }}
            >
              {name.charAt(0).toUpperCase() || <PersonIcon fontSize="large" />}
            </Avatar>
            <Typography variant="h6">
              {name || "Your Name"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
            </Typography>
          </Box>
          
          {message && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSave} noValidate>
            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              fullWidth
              required
              type="email"
              sx={{ mb: 3 }}
            />
            
            <Button 
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ 
                py: 1.5,
                borderRadius: 2
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Profile;