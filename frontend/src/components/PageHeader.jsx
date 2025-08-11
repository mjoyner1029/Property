import React from 'react';
import { Box, Typography, Breadcrumbs, Link, useMediaQuery, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const PageHeader = ({ 
  title, 
  subtitle, 
  breadcrumbs = [], 
  action
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ mb: 3 }}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          sx={{ mb: 1 }}
          aria-label="breadcrumb"
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast ? (
              <Typography key={index} color="text.primary">
                {crumb.text}
              </Typography>
            ) : (
              <Link 
                key={index} 
                component={RouterLink} 
                to={crumb.link} 
                underline="hover" 
                color="inherit"
              >
                {crumb.text}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
      
      {/* Page title and action */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="subtitle1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {action && (
          <Box sx={{ mt: isMobile ? 1 : 0 }}>
            {action}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;