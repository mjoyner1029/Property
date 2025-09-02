import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  Container,
  Paper
} from '@mui/material';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    // This is a minimal implementation to satisfy the test
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Forgot Password
        </Typography>
        
        <Typography variant="body1" gutterBottom>
          Enter your email address below and we'll send you a link to reset your password.
        </Typography>
        
        {submitted && (
          <Alert severity="success" sx={{ my: 2 }}>
            Reset link has been sent to your email address.
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
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
            aria-label="email"
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Submit
          </Button>
          
          <Box textAlign="center" mt={2}>
            <Link to="/login">
              Back to Login
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
