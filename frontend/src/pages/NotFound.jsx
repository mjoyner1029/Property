import React from "react";
import { Link } from "react-router-dom";
import { Box, Typography, Button, Container, Paper } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

export default function NotFound(){
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
        data-testid="not-found-page"
      >
        <Box 
          sx={{ 
            backgroundColor: "warning.light", 
            borderRadius: "50%", 
            p: 2, 
            mb: 2 
          }}
        >
          <ErrorOutlineIcon fontSize="large" sx={{ color: "white" }} />
        </Box>
        
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        
        <Typography variant="h4" component="h2" color="text.secondary" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography paragraph align="center" sx={{ mb: 3 }}>
          The page you're looking for doesn't exist or has been moved.
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