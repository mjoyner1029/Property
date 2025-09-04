import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * LoadingFallback component
 * Used as a fallback for React.lazy loaded components
 */
const LoadingFallback = () => {
  const theme = useTheme();
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
