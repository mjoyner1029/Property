// frontend/src/components/ErrorBoundary.jsx
import React from "react";
import axios from "axios";
import { 
  Button, Typography, Box, Paper, Container, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Divider, Alert
} from '@mui/material';
import { API_URL, ENVIRONMENT, IS_DEVELOPMENT, SENTRY_DSN } from '../config/environment';
import ErrorIcon from '@mui/icons-material/Error';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import RestoreIcon from '@mui/icons-material/Restore';
import HomeIcon from '@mui/icons-material/Home';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * ErrorBoundary captures React component errors and provides fallback UI
 * Features:
 * - Catches rendering errors in React component tree
 * - Handles offline/network connectivity issues
 * - Reports errors to backend and monitoring services
 * - Provides user-friendly error messages based on error type
 * - Shows detailed error information in development
 * - Offers recovery options (reset, reload, return home)
 * - Accepts custom fallback components
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      errorInfo: null,
      errorDetails: null,
      errorType: null,
      isOffline: false,
      isReporting: false,
      reportSuccess: null
    };
  }
  
  componentDidMount() {
    // Add listeners for online/offline events
    window.addEventListener('online', this.handleOnlineStatusChange);
    window.addEventListener('offline', this.handleOnlineStatusChange);
    
    // Initial check for online status
    this.handleOnlineStatusChange();
  }
  
  componentWillUnmount() {
    // Clean up event listeners
    window.removeEventListener('online', this.handleOnlineStatusChange);
    window.removeEventListener('offline', this.handleOnlineStatusChange);
  }
  
  handleOnlineStatusChange = () => {
    const isOffline = !navigator.onLine;
    this.setState({ isOffline });
    
    // If we're coming back online and had an error, attempt recovery
    if (!isOffline && this.state.hasError && this.state.errorType === 'network') {
      this.handleReset();
    }
  }

  static getDerivedStateFromError(error) {
    // Categorize the error based on its type
    let errorType = 'unknown';
    
    if (error instanceof SyntaxError) {
      errorType = 'syntax';
    } else if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      errorType = 'chunk';
    } else if (error.message?.includes('NetworkError') || error.message?.includes('Network Error')) {
      errorType = 'network';
    } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      errorType = 'timeout';
    } else if (error.message?.includes('permission') || error.message?.includes('PERMISSION_DENIED')) {
      errorType = 'permission';
    } else if (error.message?.includes('quota') || error.message?.includes('storage') || error.message?.includes('localStorage')) {
      errorType = 'storage';
    } else if (error.name === 'SecurityError') {
      errorType = 'security';
    }
    
    return { 
      hasError: true,
      errorDetails: error?.toString(),
      errorType
    };
  }

  componentDidCatch(error, errorInfo) {
    // Import the logger directly here since we're in a class component
    const { logger } = require('../utils/logger');
    logger.error("ErrorBoundary caught:", error, { errorInfo, errorType: this.state.errorType });
    
    this.setState({
      errorInfo,
      isReporting: true
    });

    // Report error to monitoring service if available
    this.reportError(error, errorInfo);
  }
  
  reportError = async (error, errorInfo) => {
    try {
      this.setState({ isReporting: true });
      
      // Collect error context
      const errorContext = {
        message: error.toString(),
        name: error.name,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        route: window.location.pathname,
        timestamp: new Date().toISOString(),
        userId: localStorage.getItem('userId') || 'anonymous',
        appVersion: process.env.REACT_APP_VERSION || import.meta?.env?.VITE_APP_VERSION || 'unknown',
        errorType: this.state.errorType,
        environment: ENVIRONMENT,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
      
      // Send to monitoring service if available
      if (typeof window !== 'undefined' && window.Sentry && SENTRY_DSN) {
        window.Sentry.withScope((scope) => {
          scope.setExtras(errorContext);
          scope.setTag('errorType', this.state.errorType);
          window.Sentry.captureException(error);
        });
      }
      
      // Send to backend error log endpoint
      await axios.post(`${API_URL}/log/frontend-error`, errorContext);
      
      this.setState({ 
        isReporting: false,
        reportSuccess: true
      });
    } catch (err) {
      // Import the logger directly since we're in a class component
      const { logger } = require('../utils/logger');
      logger.warn("Failed to report error", err);
      
      this.setState({ 
        isReporting: false,
        reportSuccess: false
      });
    }
  }

  // Reset error state - attempt recovery
  handleReset = () => {
    this.setState({
      hasError: false,
      errorInfo: null,
      errorDetails: null,
      errorType: null,
      isReporting: false,
      reportSuccess: null
    });
  }

  // Navigate home
  handleGoHome = () => {
    window.location.href = '/';
  }
  
  // Clear cache and reload (for chunk load errors)
  handleClearCacheAndReload = () => {
    if ('caches' in window) {
      // Clear application cache
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            return caches.delete(key);
          })
        );
      }).then(() => {
        window.location.reload(true);
      }).catch(err => {
        // If cache clear fails, just reload
        window.location.reload(true);
      });
    } else {
      // If Cache API not supported, just hard reload
      window.location.reload(true);
    }
  }
  
  // Get user-friendly message based on error type
  getErrorMessage = () => {
    const { errorType } = this.state;
    
    switch(errorType) {
      case 'chunk':
        return "The application failed to load some required resources. This may happen when a new version is deployed while you're using the app.";
      case 'network':
        return "There was a network error while trying to load resources. Please check your connection and try again.";
      case 'timeout':
        return "The operation timed out. Please try again or check your connection.";
      case 'permission':
        return "The app doesn't have permission to access required resources. Please check your browser permissions.";
      case 'storage':
        return "The app ran into storage limitations. Try clearing your browser cache or allowing more storage.";
      case 'security':
        return "A security error occurred. This might be related to content security policies or cross-origin issues.";
      case 'syntax':
        return "There was a syntax error in the application code. This is likely a bug that our team needs to fix.";
      default:
        return "We're sorry, but something went wrong while trying to display this page. Our team has been notified.";
    }
  }
  
  // Get recommended actions based on error type
  getRecommendedActions = () => {
    const { errorType } = this.state;
    
    switch(errorType) {
      case 'chunk':
        return (
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<RefreshIcon />}
            onClick={this.handleClearCacheAndReload}
          >
            Clear Cache & Reload
          </Button>
        );
      case 'network':
      case 'timeout':
        return (
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </Button>
        );
      default:
        return (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="outlined"
              startIcon={<RestoreIcon />}
              onClick={this.handleReset}
            >
              Try Recovery
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<HomeIcon />}
              onClick={this.handleGoHome}
            >
              Go to Home
            </Button>
          </Box>
        );
    }
  }

  render() {
    const { fallback } = this.props;
    const { 
      hasError, isOffline, errorType, errorInfo, errorDetails, 
      isReporting, reportSuccess 
    } = this.state;
    
    // Handle offline status
    if (isOffline) {
      return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              border: '1px solid #ff9800',
              borderRadius: 2
            }}
          >
            <Box sx={{ mb: 3, color: '#ff9800' }}>
              <WifiOffIcon sx={{ fontSize: 60 }} />
            </Box>
            <Typography variant="h5" component="h1" gutterBottom>
              You're Offline
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Please check your internet connection and try again.
              The app will automatically reconnect when your connection is restored.
            </Typography>
            
            <Box sx={{ mt: 4 }}>
              <Button 
                variant="contained" 
                color="warning"
                startIcon={<RefreshIcon />}
                onClick={() => window.location.reload()}
              >
                Retry Connection
              </Button>
            </Box>
          </Paper>
        </Container>
      );
    }
    
    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback(errorDetails, errorType, this.handleReset);
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
            <Box sx={{ mb: 3, color: '#f44336', display: 'flex', justifyContent: 'center' }}>
              <ErrorIcon sx={{ fontSize: 60 }} />
            </Box>
            
            <Typography variant="h5" component="h1" gutterBottom>
              {errorType === 'permission' 
                ? 'Permission Error' 
                : errorType === 'security'
                  ? 'Security Error'
                  : errorType === 'storage'
                    ? 'Storage Error'
                    : errorType === 'chunk'
                      ? 'Loading Error'
                      : 'Something Went Wrong'
              }
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              {this.getErrorMessage()}
            </Typography>
            
            {/* Error reporting status */}
            {isReporting && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 1 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Reporting error...
                </Typography>
              </Box>
            )}
            
            {reportSuccess === false && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                We couldn't report this error automatically. Please contact support if the issue persists.
              </Alert>
            )}
            
            {reportSuccess === true && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Error reported. Our team has been notified.
              </Alert>
            )}
            
            <Box sx={{ mt: 4 }}>
              {this.getRecommendedActions()}
            </Box>
            
            {/* Detailed error information - for dev only by default */}
            {(IS_DEVELOPMENT || this.props.showErrorDetails) && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ my: 2 }} />
                <Accordion>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="error-details-content"
                    id="error-details-header"
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WarningIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
                      <Typography>Error Details</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ textAlign: 'left' }}>
                    <Typography variant="subtitle2">Error Type:</Typography>
                    <Typography 
                      variant="body2" 
                      component="pre"
                      sx={{ 
                        p: 1, 
                        bgcolor: 'background.paper', 
                        borderRadius: 1, 
                        mb: 2, 
                        fontFamily: 'monospace' 
                      }}
                    >
                      {errorType || 'unknown'}
                    </Typography>
                    
                    <Typography variant="subtitle2">Error Message:</Typography>
                    <Typography 
                      variant="body2" 
                      component="pre"
                      sx={{ 
                        p: 1, 
                        bgcolor: 'background.paper', 
                        borderRadius: 1, 
                        mb: 2, 
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        overflowX: 'auto'
                      }}
                    >
                      {errorDetails || 'No details available'}
                    </Typography>
                    
                    <Typography variant="subtitle2">Component Stack:</Typography>
                    <Typography 
                      variant="body2" 
                      component="pre"
                      sx={{ 
                        p: 1, 
                        bgcolor: 'background.paper', 
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '300px',
                        overflow: 'auto'
                      }}
                    >
                      {errorInfo?.componentStack || 'No component stack available'}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}
