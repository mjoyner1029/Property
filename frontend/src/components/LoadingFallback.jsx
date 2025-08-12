import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import theme from '../theme';

/**
 * LoadingFallback component
 * Used as a fallback for React.lazy loaded components
 */
const LoadingFallback = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        minHeight: '200px',
        width: '100%',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default LoadingFallback;
