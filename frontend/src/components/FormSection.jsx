import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

const FormSection = ({ 
  title, 
  description, 
  children, 
  icon, 
  mb = 4, 
  divider = true 
}) => {
  return (
    <Box sx={{ mb }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon && (
          <Box sx={{ mr: 1.5, color: 'primary.main' }}>
            {icon}
          </Box>
        )}
        <Box>
          {title && (
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'medium' }}>
              {title}
            </Typography>
          )}
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
      </Box>
      
      <Box sx={{ mt: 3 }}>
        {children}
      </Box>
      
      {divider && <Divider sx={{ mt: 4 }} />}
    </Box>
  );
};

export default FormSection;