import React from 'react';
import { 
  Box, Typography, Button, Divider, Breadcrumbs,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

/**
 * PageHeader component for displaying page title, actions, and breadcrumbs
 */
export default function PageHeader({ 
  title, 
  subtitle,
  breadcrumbs = [], 
  actions,
  sx = {}
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box sx={{ mb: 3, ...sx }}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 1 }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return isLast ? (
              <Typography 
                key={index}
                color="text.primary"
                sx={{ 
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={index}
                to={crumb.path}
                style={{ 
                  textDecoration: 'none',
                  color: theme.palette.text.secondary,
                  fontSize: 14
                }}
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
      
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 2 : 0
        }}
      >
        {/* Title and subtitle */}
        <Box>
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {title}
          </Typography>
          
          {subtitle && (
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {/* Action buttons */}
        {actions && (
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: isMobile ? 'flex-start' : 'flex-end',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            {Array.isArray(actions) ? actions.map((action, index) => (
              <React.Fragment key={index}>
                {action}
              </React.Fragment>
            )) : actions}
          </Box>
        )}
      </Box>
      
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
}
