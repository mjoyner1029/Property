import React from 'react';
import { CircularProgress, Box } from '@mui/material';

const LoadingSpinner = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
    <CircularProgress color="primary" />
  </Box>
);

export default LoadingSpinner;
