import React from 'react';
import { Link } from 'react-router-dom';
import { Typography, Box, Paper, List, ListItem, Chip, Container } from '@mui/material';
import routeConfig from '../routes/routeConfig';

/**
 * RoutesIndex component
 * A development-only page showing all available routes
 * Accessible at /dev/routes
 */
const RoutesIndex = () => {
  // Sort routes by path
  const sortedRoutes = [...routeConfig].sort((a, b) => a.path.localeCompare(b.path));

  // If we're in production, don't render this component
  if (process.env.NODE_ENV === 'production') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Typography variant="h4">
          This page is only available in development mode.
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" gutterBottom>
        Routes Index
      </Typography>
      <Typography variant="body1" paragraph>
        This is a development-only page that lists all routes defined in the application.
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <List>
          {sortedRoutes.map((route, index) => (
            <ListItem 
              key={index} 
              divider={index < sortedRoutes.length - 1}
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                py: 2
              }}
            >
              <Box sx={{ flexBasis: '50%', mb: { xs: 1, sm: 0 } }}>
                <Link 
                  to={route.path === '*' ? '/non-existent-page' : route.path.replace(/:\w+/g, '1')} 
                  style={{ textDecoration: 'none' }}
                >
                  <Typography 
                    color="primary" 
                    sx={{ 
                      fontFamily: 'monospace',
                      fontWeight: 'bold'
                    }}
                  >
                    {route.path}
                  </Typography>
                </Link>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  label={route.component} 
                  color="primary" 
                  variant="outlined" 
                  size="small" 
                />
                <Chip 
                  label={route.guard} 
                  color={
                    route.guard === 'private' ? 'success' : 
                    route.guard === 'public' ? 'info' : 
                    route.guard === 'role' ? 'warning' : 
                    'default'
                  } 
                  size="small" 
                />
                {route.role && (
                  <Chip 
                    label={`role: ${route.role}`}
                    color="secondary" 
                    size="small" 
                  />
                )}
                <Chip 
                  label={route.layout ? 'with layout' : 'no layout'} 
                  variant="outlined"
                  size="small" 
                />
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>
      
      <Typography variant="subtitle2" color="textSecondary">
        Total routes: {sortedRoutes.length}
      </Typography>
    </Container>
  );
};

export default RoutesIndex;
