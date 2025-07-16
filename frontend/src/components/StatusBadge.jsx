import React from 'react';
import { Box, Typography } from '@mui/material';

const getStatusStyles = (status) => {
  const statusConfig = {
    success: {
      label: 'Success',
      color: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    active: {
      label: 'Active',
      color: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    completed: {
      label: 'Completed',
      color: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    warning: {
      label: 'Warning',
      color: '#F59E0B',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
    },
    pending: {
      label: 'Pending',
      color: '#F59E0B',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
    },
    in_progress: {
      label: 'In Progress',
      color: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    error: {
      label: 'Error',
      color: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    failed: {
      label: 'Failed',
      color: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    inactive: {
      label: 'Inactive',
      color: '#6B7280',
      backgroundColor: 'rgba(107, 114, 128, 0.1)',
    },
  };

  // Find best match for status or use default
  const normalizedStatus = status?.toLowerCase?.() || 'inactive';
  
  // Check for direct match
  if (statusConfig[normalizedStatus]) {
    return statusConfig[normalizedStatus];
  }

  // Check for partial match
  for (const key of Object.keys(statusConfig)) {
    if (normalizedStatus.includes(key)) {
      return statusConfig[key];
    }
  }

  // Default to inactive
  return statusConfig.inactive;
};

const StatusBadge = ({ status, label, size = 'medium', customStyles = {} }) => {
  const displayLabel = label || status || 'Unknown';
  const statusStyles = getStatusStyles(status);
  
  // Size variations
  const sizeStyles = {
    small: {
      py: 0.25, 
      px: 1, 
      fontSize: '0.75rem'
    },
    medium: {
      py: 0.5, 
      px: 1.5, 
      fontSize: '0.875rem'
    },
    large: {
      py: 0.75, 
      px: 2, 
      fontSize: '1rem'
    }
  };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 8,
        color: statusStyles.color,
        backgroundColor: statusStyles.backgroundColor,
        fontWeight: 'medium',
        ...sizeStyles[size],
        ...customStyles
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: statusStyles.color,
          mr: 1
        }}
      />
      <Typography
        variant="body2"
        component="span"
        sx={{ 
          fontWeight: 'medium', 
          fontSize: 'inherit',
          lineHeight: 1 
        }}
      >
        {displayLabel}
      </Typography>
    </Box>
  );
};

export default StatusBadge;