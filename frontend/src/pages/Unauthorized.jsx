import React from "react";
import { Link } from "react-router-dom";
import { Box, Typography, Button, Container, Paper } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";

/**
 * Unauthorized component displayed when users attempt to access pages they don't have permission for
 */
export default function Unauthorized() {
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          borderRadius: 2
        }}
        data-testid="unauthorized-page"
      >
        <Box 
          sx={{ 
            backgroundColor: "error.light", 
            borderRadius: "50%", 
            p: 2, 
            mb: 2 
          }}
        >
          <LockIcon fontSize="large" sx={{ color: "white" }} />
        </Box>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Access Denied
        </Typography>
        
        <Typography variant="h6" component="h2" color="text.secondary" gutterBottom>
          Unauthorized Access
        </Typography>
        
        <Typography paragraph align="center" sx={{ mb: 3 }}>
          You don't have permission to view this page. Please contact your administrator
          if you believe this is an error.
        </Typography>
        
        <Button 
          variant="contained" 
          component={Link} 
          to="/" 
          color="primary"
          data-testid="back-to-home-button"
        >
          Back to Home
        </Button>
      </Paper>
    </Container>
  );
}