import React from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Box,
  Avatar, Button, Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
// import UserMenu from './UserMenu';
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
              {/* <UserMenu /> */}
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
