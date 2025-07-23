import React, { useState, createContext, useContext } from 'react';
import { Snackbar, Alert as MuiAlert } from '@mui/material';

// Create context for feedback
const FeedbackContext = createContext();

// Custom hook to use the feedback context
export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

// Alert component that extends MuiAlert
const Alert = React.forwardRef((props, ref) => {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export const FeedbackProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info'); // 'error', 'warning', 'info', or 'success'
  const [autoHideDuration, setAutoHideDuration] = useState(6000);

  // Function to show a feedback message
  const showFeedback = (newMessage, newSeverity = 'info', duration = 6000) => {
    setMessage(newMessage);
    setSeverity(newSeverity);
    setAutoHideDuration(duration);
    setOpen(true);
  };

  // Convenience methods for different types of feedback
  const showSuccess = (msg, duration) => showFeedback(msg, 'success', duration);
  const showError = (msg, duration) => showFeedback(msg, 'error', duration);
  const showInfo = (msg, duration) => showFeedback(msg, 'info', duration);
  const showWarning = (msg, duration) => showFeedback(msg, 'warning', duration);

  // Handle close
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <FeedbackContext.Provider 
      value={{ 
        showFeedback, 
        showSuccess, 
        showError, 
        showInfo, 
        showWarning 
      }}
    >
      {children}
      <Snackbar 
        open={open} 
        autoHideDuration={autoHideDuration} 
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={severity}>
          {message}
        </Alert>
      </Snackbar>
    </FeedbackContext.Provider>
  );
};

export default FeedbackProvider;
