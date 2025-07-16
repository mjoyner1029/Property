import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  CircularProgress,
  Alert
} from "@mui/material";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get(`/api/verify/${token}`)
      .then(res => {
        setStatus("success");
        setMessage(res.data.message || "Your email has been successfully verified!");
      })
      .catch(err => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed. The link may be invalid or expired.");
      });
  }, [token]);

  return (
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
          {status === "loading" && (
            <>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Verifying your email...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we verify your email address.
              </Typography>
            </>
          )}
          
          {status === "success" && (
            <>
              <CheckCircleOutlineIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'success.main',
                  mb: 2
                }} 
              />
              <Typography variant="h5" component="h1" fontWeight={600} gutterBottom>
                Email Verified!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {message}
              </Typography>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                sx={{ 
                  borderRadius: 2,
                  px: 4,
                  py: 1
                }}
              >
                Log In
              </Button>
            </>
          )}
          
          {status === "error" && (
            <>
              <ErrorOutlineIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'error.main',
                  mb: 2
                }} 
              />
              <Typography variant="h5" component="h1" fontWeight={600} gutterBottom>
                Verification Failed
              </Typography>
              <Alert severity="error" sx={{ mb: 3 }}>
                {message}
              </Alert>
              <Typography variant="body2" sx={{ mb: 4 }}>
                If you're having trouble, please try requesting a new verification email.
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2,
                    px: 3
                  }}
                >
                  Back to Login
                </Button>
                <Button
                  component={Link}
                  to="/resend-verification"
                  variant="contained"
                  sx={{ 
                    borderRadius: 2,
                    px: 3
                  }}
                >
                  Resend Verification
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
