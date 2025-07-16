import React from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Container
} from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";

const NotFound = () => (
  <Container maxWidth="sm">
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "80vh",
        py: 8
      }}
    >
      <Typography variant="h2" fontWeight={600} sx={{ mb: 2 }}>
        404
      </Typography>
      <Typography variant="h5" fontWeight={500} sx={{ mb: 4 }}>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: "center" }}>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Button 
        component={Link} 
        to="/" 
        variant="contained" 
        color="primary"
        startIcon={<HomeIcon />}
        sx={{ 
          borderRadius: 2,
          px: 3,
          py: 1
        }}
      >
        Back to Home
      </Button>
    </Box>
  </Container>
);

export default NotFound;