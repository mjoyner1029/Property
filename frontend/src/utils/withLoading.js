import React, { useState, useEffect } from 'react';
import { CircularProgress, Box } from '@mui/material';
import logger from './logger';

/**
 * Higher Order Component that adds loading state, error handling, and retry capability
 * to components that fetch data
 * 
 * @param {Component} Component - The component to wrap
 * @param {Object} options - Configuration options
 * @returns {Component} The wrapped component with loading state
 */
const withLoading = (Component, options = {}) => {
  const {
    loadingMessage = 'Loading...',
    errorMessage = 'There was an error loading the data.',
    loadingHeight = 400, // Height of loading container
    retryEnabled = true, // Allow retry on error
    loadingComponent = null // Custom loading component
  } = options;

  return function WithLoadingComponent(props) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    const { fetchData, ...restProps } = props;

    const handleRetry = () => {
      setLoading(true);
      setError(null);
      setRetryCount(prevCount => prevCount + 1);
    };

    useEffect(() => {
      let isMounted = true;
      
      const load = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Execute the data fetch function passed as prop
          const result = await fetchData();
          
          // Only update state if component is still mounted
          if (isMounted) {
            setData(result);
            setLoading(false);
          }
        } catch (err) {
          logger.error('Error in withLoading component', err);
          
          if (isMounted) {
            setError(err);
            setLoading(false);
          }
        }
      };

      if (fetchData && typeof fetchData === 'function') {
        load();
      } else {
        setLoading(false);
      }

      return () => {
        isMounted = false;
      };
    }, [fetchData, retryCount]);

    if (loading) {
      return loadingComponent || (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: loadingHeight, 
            width: '100%' 
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress />
            <Box sx={{ mt: 2, color: 'text.secondary' }}>
              {loadingMessage}
            </Box>
          </Box>
        </Box>
      );
    }

    if (error) {
      return (
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: loadingHeight, 
            width: '100%',
            textAlign: 'center',
            p: 2
          }}
        >
          <Box sx={{ color: 'error.main', mb: 2 }}>
            {errorMessage}
          </Box>
          
          {retryEnabled && (
            <button 
              onClick={handleRetry}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          )}
        </Box>
      );
    }

    // Render the wrapped component with the fetched data
    return <Component {...restProps} data={data} />;
  };
};

export default withLoading;
