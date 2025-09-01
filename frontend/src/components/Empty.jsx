import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const Empty = ({ 
  title = 'No data found', 
  message = 'There are no items to display at this time.',
  icon,
  actionText,
  onActionClick,
  actionTestId = 'empty-action' // Default test ID for the action button
}) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 2,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        border: '1px dashed',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}>
        {icon || <SearchOffIcon sx={{ fontSize: 'inherit', opacity: 0.6 }} />}
      </Box>
      
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        {message}
      </Typography>
      
      {actionText && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={onActionClick}
          sx={{ borderRadius: 2 }}
          data-testid={actionTestId}
          id="empty-action-button"
          aria-label={actionText}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default Empty;