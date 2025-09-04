// frontend/src/observability/SentryDebug.jsx
import React, { useState } from 'react';
import { Button, Typography, Box, Paper, Grid, Container, Alert, Divider, Chip } from '@mui/material';
import { captureException } from './sentry';
import { SENTRY_DSN, SENTRY_ENVIRONMENT } from '../config/environment';

/**
 * Component for testing Sentry integration
 * Can be included on a debug page or admin panel
 */
const SentryDebug = () => {
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);

  // Check if Sentry is configured
  const isSentryConfigured = Boolean(process.env.REACT_APP_SENTRY_DSN);

  // Generate a test error to send to Sentry
  const handleTestError = () => {
    setTestResult(null);
    setTestError(null);
    
    try {
      // Create a test error
      const testError = new Error('This is a test error from SentryDebug component');
      testError.metadata = {
        test: true,
        timestamp: new Date().toISOString()
      };
      
      // Report to Sentry
      const eventId = captureException(testError, {
        tags: {
          test: true,
          location: 'SentryDebug',
        }
      });
      
      setTestResult({
        success: true,
        eventId: eventId || 'Unknown',
        timestamp: new Date().toISOString()
      });
      
      // Intentionally throw to test error boundary
      if (false) {
        // This code will never execute, but prevents the linter warning
        throw testError;
      }
      
    } catch (error) {
      setTestError(error.message);
    }
  };
  
  // Create a real error by trying to access a non-existent property
  const handleRealError = () => {
    try {
      // This will cause a real error
      const obj = null;
      // @ts-ignore - We want this to fail
      document.title = obj.nonExistentProperty;
    } catch (error) {
      // In a real app scenario, this error would bubble up to the ErrorBoundary
      // But for testing, we'll catch it and report manually
      captureException(error, {
        tags: {
          test: true,
          location: 'SentryDebug',
          type: 'real-error'
        }
      });
      
      setTestError("Generated a real error - check Sentry dashboard");
    }
  };
  
  // Render a UI element that will crash when rendered
  const CrashingComponent = () => {
    // This will cause a React rendering error
    throw new Error('This component intentionally crashed');
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Sentry Debug Tools
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Configuration Status
              </Typography>
              
              <Alert severity={isSentryConfigured ? "success" : "warning"} sx={{ mb: 2 }}>
                Sentry is {isSentryConfigured ? 'configured' : 'not configured'}
              </Alert>
              
              {isSentryConfigured && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Environment:</strong> {SENTRY_ENVIRONMENT}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>DSN Status:</strong> {SENTRY_DSN ? 'Set' : 'Not Set'} (via environment.js)
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>DSN Status (direct):</strong> {process.env.REACT_APP_SENTRY_DSN ? 'Set' : 'Not Set'} (via REACT_APP_SENTRY_DSN)
                  </Typography>
                  <Typography variant="body2">
                    <strong>Release:</strong> {process.env.REACT_APP_VERSION || 'Unknown'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Test Actions
            </Typography>
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleTestError}
              disabled={!isSentryConfigured}
              sx={{ mr: 2, mb: 2 }}
            >
              Send Test Error
            </Button>
            
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleRealError}
              disabled={!isSentryConfigured}
              sx={{ mb: 2 }}
            >
              Generate Real Error
            </Button>
            
            {testResult && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Test error reported to Sentry
                </Typography>
                <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                  Event ID: <Chip label={testResult.eventId} size="small" />
                </Typography>
                <Typography variant="caption" component="div">
                  Timestamp: {testResult.timestamp}
                </Typography>
              </Alert>
            )}
            
            {testError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {testError}
              </Alert>
            )}
          </Grid>
        </Grid>
        
        {/* Uncomment to test error boundary */}
        {/* {isSentryConfigured && false && <CrashingComponent />} */}
      </Paper>
    </Container>
  );
};

export default SentryDebug;
