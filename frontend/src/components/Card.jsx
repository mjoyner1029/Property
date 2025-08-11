import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const Card = ({ 
  title, 
  subtitle, 
  children, 
  icon, 
  action, 
  variant = "default", 
  className = "", 
  elevation = 1 
}) => {
  // Set color scheme based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return { borderTop: '4px solid #3B82F6' };
      case "success":
        return { borderTop: '4px solid #10B981' };
      case "warning":
        return { borderTop: '4px solid #F59E0B' };
      case "error":
        return { borderTop: '4px solid #EF4444' };
      case "info":
        return { borderTop: '4px solid #6366F1' };
      default:
        return {};
    }
  };

  return (
    <Paper 
      elevation={elevation} 
      sx={{ 
        p: 3, 
        height: '100%', 
        backgroundColor: '#1F2327',
        color: '#F5F5F5',
        borderRadius: 2,
        ...getVariantStyles()
      }}
      className={className}
    >
      {(title || icon || action) && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon && (
              <Box sx={{ mr: 1, color: 'primary.main' }}>
                {icon}
              </Box>
            )}
            <Box>
              {title && (
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'medium' }}>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          {action && (
            <Box>
              {action}
            </Box>
          )}
        </Box>
      )}
      <Box>
        {children}
      </Box>
    </Paper>
  );
};

export default Card;