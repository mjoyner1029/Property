import React from 'react';
import * as Sentry from '@sentry/react';
import { 
  Button, Typography, Box, Paper, Container, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Divider, Alert,
  Stack, Link, Chip
} from '@mui/material';
import { API_URL, ENVIRONMENT, IS_DEVELOPMENT, APP_VERSION } from '../config/environment';
import { captureException } from '../observability/sentry';
import ErrorIcon from '@mui/icons-material/Error';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import RestoreIcon from '@mui/icons-material/Restore';
import HomeIcon from '@mui/icons-material/Home';
import RefreshIcon from '@mui/icons-material/Refresh';
import BugReportIcon from '@mui/icons-material/BugReport';

/**
 * Enhanced ErrorBoundary with advanced Sentry integration and performance analysis
 * 
 * Features:
 * - Comprehensive error tracking through Sentry
 * - Performance data collection on error to analyze impact
 * - Detailed contextual information for debugging
 * - User-friendly error messages with recovery options
 * - Offline handling and network connectivity detection
 * - Detailed logging and diagnostics
 */
class EnhancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      errorInfo: null,
      errorDetails: null,
      errorType: null,
      isOffline: false,
      isReporting: false,
      reportSuccess: null,
      errorEventId: null,
      componentStack: null,
      performanceData: null,
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
    } else if (error.name === 'ReferenceError') {
      errorType = 'reference';
    } else if (error.name === 'TypeError') {
      errorType = 'type';
    }
    
    return { 
      hasError: true,
      errorDetails: error?.toString(),
      errorType
    };
  }

  componentDidCatch(error, errorInfo) {
    // Collect performance data
    const performanceData = this.collectPerformanceData();
    
    // Create component stack trace
    const componentStack = errorInfo?.componentStack 
      ? errorInfo.componentStack
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.trim())
      : [];

    this.setState({
      errorInfo: errorInfo,
      performanceData: performanceData,
      componentStack: componentStack
    });

    // Import the logger directly here since we're in a class component
    const { logger } = require('../utils/logger');
    logger.error("ErrorBoundary caught:", error, { 
      errorInfo, 
      errorType: this.state.errorType,
      performanceData
    });

    // Report to Sentry with enhanced context
    const eventId = captureException(error, {
      extra: {
        componentStack,
        errorType: this.state.errorType,
        performanceData,
        environment: ENVIRONMENT,
        appVersion: APP_VERSION || 'unknown',
        userAgent: navigator.userAgent
      }
    });

    if (eventId) {
      this.setState({ errorEventId: eventId });
    }
    
    // Report to backend error logging endpoint
    this.reportErrorToBackend(error, errorInfo, this.state.errorType, eventId);
  }

  /**
   * Collect performance metrics to help debug issues
   */
  collectPerformanceData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      memory: {},
      navigation: {},
      resources: [],
      connection: {}
    };

    // Memory usage if available
    if (window.performance && window.performance.memory) {
      data.memory = {
        jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit,
        totalJSHeapSize: window.performance.memory.totalJSHeapSize,
        usedJSHeapSize: window.performance.memory.usedJSHeapSize
      };
    }

    // Navigation timing
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      data.navigation = {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domReady: timing.domComplete - timing.domLoading,
        firstByte: timing.responseStart - timing.navigationStart,
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart
      };
    }

    // Resource timing
    if (window.performance && window.performance.getEntriesByType) {
      data.resources = window.performance.getEntriesByType('resource')
        .slice(-10) // Only get the last 10 resources
        .map(entry => ({
          name: entry.name.substring(entry.name.lastIndexOf('/') + 1),
          duration: entry.duration,
          size: entry.encodedBodySize || 0,
          startTime: entry.startTime
        }));
    }

    // Network information
    if (navigator.connection) {
      const conn = navigator.connection;
      data.connection = {
        downlink: conn.downlink,
        effectiveType: conn.effectiveType,
        rtt: conn.rtt,
        saveData: conn.saveData
      };
    }

    return data;
  }

  /**
   * Report error to backend logging system
   */
  reportErrorToBackend = async (error, errorInfo, errorType, eventId) => {
    if (!API_URL) return;
    
    this.setState({ isReporting: true });
    
    try {
      const payload = {
        message: error.message || 'Unknown error',
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        type: errorType,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        sentryEventId: eventId
      };
      
      // Report to backend error logging API
      await fetch(`${API_URL}/api/errors/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      this.setState({ isReporting: false, reportSuccess: true });
    } catch (reportError) {
      console.error('Failed to report error to backend:', reportError);
      this.setState({ isReporting: false, reportSuccess: false });
    }
  }
  
  /**
   * Reset the error state to allow the component tree to re-render
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      errorInfo: null,
      errorDetails: null,
      errorType: null,
      errorEventId: null,
      componentStack: null,
      performanceData: null
    });
  }
  
  /**
   * Reload the page to fresh start the application
   */
  handleReload = () => {
    window.location.reload();
  }
  
  /**
   * Navigate to home page
   */
  handleGoHome = () => {
    window.location.href = '/';
  }

  /**
   * Let user report the issue directly to Sentry
   */
  handleReportFeedback = () => {
    if (this.state.errorEventId) {
      Sentry.showReportDialog({
        eventId: this.state.errorEventId,
        title: 'Report a Problem',
        subtitle: 'Our development team has been notified.',
        subtitle2: 'If you would like to help, please tell us what happened:',
        labelName: 'Name',
        labelEmail: 'Email',
        labelComments: 'What happened?',
        labelClose: 'Close',
        labelSubmit: 'Submit',
        successMessage: 'Thank you for your feedback!'
      });
    }
  }

  render() {
    // If the fallback prop is provided, use that instead of the default fallback
    if (this.state.hasError && this.props.fallback) {
      return this.props.fallback({
        error: this.state.errorDetails,
        errorInfo: this.state.errorInfo,
        errorType: this.state.errorType,
        resetError: this.handleReset
      });
    }
    
    // Default error UI
    if (this.state.hasError) {
      // Network connectivity issues
      if (this.state.isOffline || this.state.errorType === 'network') {
        return (
          <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
              <WifiOffIcon color="warning" sx={{ fontSize: 60 }} />
              <Typography variant="h5" sx={{ mt: 2 }}>
                Connection Problem
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
                It looks like you're offline or experiencing network issues. Please check your internet connection and try again.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button 
                  variant="contained" 
                  onClick={this.handleReset} 
                  startIcon={<RestoreIcon />}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={this.handleReload} 
                  startIcon={<RefreshIcon />}
                >
                  Reload Page
                </Button>
              </Stack>
            </Paper>
          </Container>
        );
      }
      
      // Chunk loading errors (typically from code-splitting)
      if (this.state.errorType === 'chunk') {
        return (
          <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
              <WarningIcon color="warning" sx={{ fontSize: 60 }} />
              <Typography variant="h5" sx={{ mt: 2 }}>
                Application Update Available
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
                It looks like the application has been updated since you last loaded it. Please reload the page to get the latest version.
              </Typography>
              <Button 
                variant="contained" 
                onClick={this.handleReload} 
                startIcon={<RefreshIcon />}
              >
                Reload Application
              </Button>
            </Paper>
          </Container>
        );
      }
      
      // Generic error fallback for all other cases
      return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ErrorIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h5">
                Something went wrong
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              The application encountered an unexpected error. Our team has been notified and we're working to fix the issue.
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
              <Button 
                variant="contained" 
                onClick={this.handleReset} 
                startIcon={<RestoreIcon />}
              >
                Try Again
              </Button>
              <Button 
                variant="outlined" 
                onClick={this.handleReload} 
                startIcon={<RefreshIcon />}
              >
                Reload Page
              </Button>
              <Button 
                variant="outlined" 
                onClick={this.handleGoHome} 
                startIcon={<HomeIcon />}
              >
                Go to Home
              </Button>
              {this.state.errorEventId && (
                <Button 
                  variant="outlined" 
                  color="secondary"
                  onClick={this.handleReportFeedback} 
                  startIcon={<BugReportIcon />}
                >
                  Report Problem
                </Button>
              )}
            </Stack>
            
            {this.state.isReporting && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress size={20} sx={{ mr: 2 }} />
                <Typography variant="body2">Reporting error details...</Typography>
              </Box>
            )}
            
            {this.state.reportSuccess === true && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Error details successfully submitted to our team.
              </Alert>
            )}
            
            {this.state.reportSuccess === false && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Could not report error details. Please try again later.
              </Alert>
            )}
            
            {/* Show technical details in development or with debug flag */}
            {(IS_DEVELOPMENT || window.localStorage.getItem('debug_errors')) && (
              <Box sx={{ mt: 3 }}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Technical Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Chip 
                        label={`Error Type: ${this.state.errorType || 'unknown'}`} 
                        color="error" 
                        variant="outlined" 
                        size="small" 
                        sx={{ mb: 1, mr: 1 }} 
                      />
                      
                      {this.state.errorEventId && (
                        <Chip 
                          label={`Event ID: ${this.state.errorEventId}`} 
                          color="info" 
                          variant="outlined" 
                          size="small" 
                          sx={{ mb: 1, mr: 1 }} 
                        />
                      )}
                      
                      <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>
                        Error Message:
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, my: 1, bgcolor: 'grey.100', fontFamily: 'monospace', overflow: 'auto' }}>
                        <pre style={{ margin: 0, overflow: 'auto' }}>{this.state.errorDetails || 'Unknown error'}</pre>
                      </Paper>
                      
                      {this.state.componentStack && (
                        <>
                          <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>
                            Component Stack:
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, my: 1, bgcolor: 'grey.100', fontFamily: 'monospace', overflow: 'auto', maxHeight: '200px' }}>
                            <pre style={{ margin: 0, overflow: 'auto' }}>
                              {this.state.componentStack.slice(0, 15).join('\n')}
                            </pre>
                          </Paper>
                        </>
                      )}
                      
                      {this.state.performanceData && (
                        <>
                          <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>
                            Performance Data:
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, my: 1, bgcolor: 'grey.100', fontFamily: 'monospace', overflow: 'auto', maxHeight: '200px' }}>
                            <pre style={{ margin: 0, overflow: 'auto' }}>
                              {JSON.stringify(this.state.performanceData, null, 2)}
                            </pre>
                          </Paper>
                        </>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Need immediate assistance? <Link href="/support" underline="hover">Contact Support</Link>
              </Typography>
            </Box>
          </Paper>
        </Container>
      );
    }

    // When there's no error, render the children normally
    return this.props.children;
  }
}

// Create a wrapped version with Sentry integration
const ErrorBoundary = Sentry.withErrorBoundary(EnhancedErrorBoundary, {
  showDialog: false, // We handle dialogs manually with our enhanced component
  dialogOptions: {
    title: 'Application Error',
    subtitle: 'Our team has been notified'
  }
});

export default ErrorBoundary;
