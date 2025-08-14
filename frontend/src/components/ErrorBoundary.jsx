// frontend/src/components/ErrorBoundary.jsx
import React from "react";
import axios from "axios";
import { Button, Typography, Box, Paper, Container } from '@mui/material';
import { API_URL } from '../config/environment';
import ErrorIcon from '@mui/icons-material/Error';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      errorInfo: null,
      errorDetails: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorDetails: error?.toString() 
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    
    this.setState({
      errorInfo: errorInfo
    });

    // Send to backend error log endpoint
    axios.post(`${API_URL}/api/log/frontend-error`, {
      message: error.toString(),
      stack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem('userId') || 'anonymous'
    }).catch(err => {
      console.warn("Failed to send error to backend", err);
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, errorInfo: null, errorDetails: null });
  }

  handleGoHome = () => {
    window.location.href = '/';
  }

  render() {
    const { fallback } = this.props;
    
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback(this.state.errorDetails, this.handleReset);
      }
      
      // Otherwise use the default error UI
      return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              border: '1px solid #f44336',
              borderRadius: 2
            }}
          >
            <Box sx={{ mb: 3, color: '#f44336' }}>
              <ErrorIcon sx={{ fontSize: 60 }} />
            </Box>
            <Typography variant="h5" component="h1" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We're sorry, but we encountered an error while trying to display this page. 
              This has been automatically reported to our team.
            </Typography>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={this.handleGoHome}
              >
                Go to Home
              </Button>
            </Box>
            
            {/* Only show in development mode */}
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 4, textAlign: 'left', p: 2, bgcolor: '#f5f5f5', borderRadius: 1, maxHeight: '200px', overflow: 'auto' }}>
                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {this.state.errorDetails}
                  {this.state.errorInfo?.componentStack}
                </Typography>
              </Box>
            )}
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}
