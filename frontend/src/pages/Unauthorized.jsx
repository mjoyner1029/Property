import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Container,
  Paper
} from "@mui/material";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const Unauthorized = () => (
  <Container maxWidth="sm">
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        py: 4
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: 'center',
          boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
          borderRadius: 3,
          width: '100%'
        }}
      >
        <ErrorOutlineIcon 
          sx={{ 
            fontSize: 64, 
            color: 'error.main',
            mb: 2
          }} 
        />
        
        <Typography variant="h5" component="h1" fontWeight={600} gutterBottom>
          Unauthorized Access
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          You don't have permission to view this page.
        </Typography>
        
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          sx={{ 
            borderRadius: 2,
            px: 4,
            py: 1
          }}
        >
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  </Container>
);

export default Unauthorized;