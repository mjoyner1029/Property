import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Divider, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Avatar, 
  Menu, 
  MenuItem,
  Badge,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  Build as BuildIcon,
  AttachMoney as PaymentsIcon,
  People as TenantIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Notifications as NotificationsIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const drawerWidth = 260;

export default function MainLayout({ children }) {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const _theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  
  // Mock notification count - replace with actual data
  const notificationCount = 4;
  
  // Navigation items based on user role
  const getNavItems = () => {
    const items = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
      { text: 'Properties', icon: <HomeIcon />, path: '/properties' },
      { text: 'Maintenance', icon: <BuildIcon />, path: '/maintenance' },
    ];
    
    if (user?.role === 'landlord' || user?.role === 'admin') {
      items.push(
        { text: 'Payments', icon: <PaymentsIcon />, path: '/payments' },
        { text: 'Tenants', icon: <TenantIcon />, path: '/tenants' }
      );
    } else if (user?.role === 'tenant') {
      items.push(
        { text: 'Pay Rent', icon: <PaymentsIcon />, path: '/pay-portal' }
      );
    }
    
    items.push(
      { text: 'Messages', icon: <EmailIcon />, path: '/messages' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
      { text: 'Support', icon: <HelpIcon />, path: '/support' }
    );
    
    return items;
  };
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };
  
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  const handleNotificationsOpen = (event) => {
    setNotifAnchor(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotifAnchor(null);
  };
  
  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/login');
  };
  
  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
        <Box 
          component="img"
          src={logo}
          alt="Asset Anchor"
          sx={{ height: 40 }}
        />
      </Toolbar>
      <Divider />
      <List>
        {getNavItems().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.light + '20',
                  borderRight: `3px solid ${theme.palette.primary.main}`,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light + '30',
                  }
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path 
                  ? theme.palette.primary.main 
                  : 'inherit'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 400
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          boxShadow: 'none',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              onClick={handleNotificationsOpen}
            >
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                ml: 2,
                cursor: 'pointer'
              }}
              onClick={handleUserMenuOpen}
            >
              <Avatar
                alt={user?.name || "User"}
                src={user?.avatar || ""}
                sx={{ width: 32, height: 32 }}
              />
              {!isMobile && (
                <>
                  <Typography sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
                    {user?.name || "User"}
                  </Typography>
                  <ArrowDownIcon fontSize="small" sx={{ ml: 0.5 }} />
                </>
              )}
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh'
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        {children}
      </Box>
      
      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => {
          handleUserMenuClose();
          navigate('/profile');
        }}>
          My Profile
        </MenuItem>
        <MenuItem onClick={() => {
          handleUserMenuClose();
          navigate('/settings');
        }}>
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={handleNotificationsClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          style: { maxHeight: 400, width: 320 }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
          <Typography 
            variant="body2" 
            color="primary" 
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              handleNotificationsClose();
              navigate('/notifications');
            }}
          >
            View All
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleNotificationsClose}>
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" fontWeight="medium">New maintenance request</Typography>
            <Typography variant="caption" color="text.secondary">Unit 101 - 5 minutes ago</Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleNotificationsClose}>
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" fontWeight="medium">Payment received</Typography>
            <Typography variant="caption" color="text.secondary">John Smith - 2 hours ago</Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleNotificationsClose}>
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" fontWeight="medium">Lease expiring soon</Typography>
            <Typography variant="caption" color="text.secondary">Unit 205 - 1 day ago</Typography>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
}