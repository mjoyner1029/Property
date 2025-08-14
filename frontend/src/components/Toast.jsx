// frontend/src/components/Toast.jsx
import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from '@mui/material/styles';

/**
 * Toast notification system configured to match the app's design
 */
const Toast = () => {
  const theme = useTheme();
  
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme.palette.mode === 'dark' ? 'dark' : 'light'}
      toastStyle={{
        borderRadius: '8px',
        boxShadow: theme.shadows[3]
      }}
    />
  );
};

// Export the component and toast API for convenience
export { toast };
export default Toast;
