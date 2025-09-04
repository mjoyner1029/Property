#!/bin/bash
# Script to fix theme ESLint errors in frontend components

echo "Fixing theme issues in ChartCard.jsx"
cat > src/components/ChartCard.jsx << 'EOL'
import React from 'react';
import { Card, CardContent, CardHeader, Box, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export default function ChartCard({ title, chart, action, menu }) {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: theme.shadows[1],
        borderRadius: 2
      }}
    >
      <CardHeader
        title={title}
        titleTypographyProps={{ variant: 'h6', fontWeight: 'medium' }}
        action={
          menu ? (
            <IconButton aria-label="settings">
              <MoreVertIcon />
            </IconButton>
          ) : action
        }
        sx={{ pb: 0 }}
      />
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center',
          pt: 2,
          '& canvas': { maxWidth: '100%' },
          bgcolor: theme.palette.background.default 
        }}
      >
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
          {chart}
        </Box>
      </CardContent>
    </Card>
  );
}
EOL

echo "Fixing theme issues in StatsCard.jsx"
cat > src/components/StatsCard.jsx << 'EOL'
import React from 'react';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

/**
 * StatsCard displays a metric with optional icon, change indicator, and trend
 */
export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  change, 
  trend,
  color = 'primary',
  sx = {}
}) {
  const theme = useTheme();
  
  const isPositive = trend === 'up';
  const TrendIcon = isPositive ? ArrowUpwardIcon : ArrowDownwardIcon;
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        borderRadius: 2,
        boxShadow: theme.shadows[1],
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
        ...sx
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icon && (
            <Box 
              sx={{ 
                mr: 2, 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                p: 1,
                borderRadius: 1,
                bgcolor: `${color}.light`,
                color: `${color}.main`
              }}
            >
              {icon}
            </Box>
          )}
          <Typography 
            variant="subtitle2" 
            color="textSecondary" 
            sx={{ fontWeight: 500 }}
          >
            {title}
          </Typography>
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 700, my: 1 }}>
          {value}
        </Typography>

        {(change || subtitle) && <Divider sx={{ my: 1 }} />}

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          {change && trend && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                mr: 1,
                color: isPositive ? 'success.main' : 'error.main'
              }}
            >
              <TrendIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600, ml: 0.5 }}>
                {change}
              </Typography>
            </Box>
          )}
          
          {subtitle && (
            <Typography variant="caption" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
EOL

echo "Fixing theme issues in Toast.jsx"
cat > src/components/Toast.jsx << 'EOL'
import React from 'react';
import { Snackbar, Alert, Box, Typography, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Enhanced Toast component for showing notifications
 * Supports different severity levels, custom actions, and icons
 */
export default function Toast({
  open = false,
  message = '',
  severity = 'success',
  duration = 5000,
  position = { vertical: 'bottom', horizontal: 'right' },
  onClose,
  action,
  title
}) {
  const theme = useTheme();
  
  // Icon mapping based on severity
  const icons = {
    success: <CheckCircleOutlineIcon fontSize="small" sx={{ mr: 1 }} />,
    info: <InfoOutlinedIcon fontSize="small" sx={{ mr: 1 }} />,
    warning: <WarningAmberOutlinedIcon fontSize="small" sx={{ mr: 1 }} />,
    error: <ErrorOutlineIcon fontSize="small" sx={{ mr: 1 }} />
  };

  return (
    <Snackbar
      anchorOrigin={position}
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      sx={{
        maxWidth: '80vw',
        minWidth: { xs: '80vw', sm: 'auto' }
      }}
    >
      <Alert
        severity={severity}
        variant="filled"
        sx={{
          width: '100%',
          boxShadow: theme.shadows[3],
          display: 'flex',
          alignItems: 'center',
          py: title ? 1 : 0.75
        }}
        action={action || (
          <IconButton
            size="small"
            color="inherit"
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
        icon={icons[severity]}
      >
        <Box>
          {title && (
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25 }}>
              {title}
            </Typography>
          )}
          <Typography variant="body2">{message}</Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
}
EOL

echo "Fixing theme issues in PageHeader.jsx"
cat > src/components/PageHeader.jsx << 'EOL'
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
EOL

echo "Fixing theme issues in NavBar.jsx"
cat > src/components/NavBar.jsx << 'EOL'
import React from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Box,
  Avatar, Button, Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import UserMenu from './UserMenu';
import { useAuth, useApp } from '../context';
import Logo from './Logo';

/**
 * Top navigation bar component with responsive design
 * Features app title/logo, navigation toggle, notification dropdown & user menu
 */
export default function NavBar({ onDrawerToggle }) {
  const { user } = useAuth();
  const { toggleDarkMode, setAppState } = useApp();
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          height: 64
        }}
      >
        {/* Left side - Logo and menu toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={onDrawerToggle}
            edge="start"
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/dashboard')}
          >
            <Logo sx={{ height: 32, mr: 1 }} />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                fontWeight: 600
              }}
            >
              AssetAnchor
            </Typography>
          </Box>
        </Box>

        {/* Right side - Actions and user menu */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {user && (
            <>
              <NotificationDropdown />
              <UserMenu />
            </>
          )}
          
          {!user && (
            <Box>
              <Button
                color="primary"
                variant="outlined"
                size="small"
                onClick={() => navigate('/login')}
                sx={{ mr: 1 }}
              >
                Sign In
              </Button>
              <Button
                color="primary"
                variant="contained"
                size="small"
                onClick={() => navigate('/register')}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
EOL

echo "Fixes applied to theme issues in key components. Run 'npx eslint src' to check for remaining issues."
