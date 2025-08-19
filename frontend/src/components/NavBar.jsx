import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Menu, 
  MenuItem,
  Avatar,
  Badge,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../context/AuthContext';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };
  
  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };
  
  const handleNotificationsOpen = (event) => {
    setNotifAnchor(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotifAnchor(null);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        backgroundColor: 'background.paper', 
        color: 'text.primary',
        boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
        zIndex: (theme) => theme.zIndex.drawer + 1 
      }}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMobileMenuOpen}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Typography 
          variant="h6" 
          component={Link} 
          to="/" 
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'inherit',
            fontWeight: 600
          }}
        >
          Asset Anchor
        </Typography>
        
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              component={Link} 
              to="/dashboard" 
              color="inherit"
              sx={{ mx: 1 }}
            >
              Dashboard
            </Button>
            {user?.role === 'landlord' && (
              <>
                <Button 
                  component={Link} 
                  to="/properties" 
                  color="inherit"
                  sx={{ mx: 1 }}
                >
                  Properties
                </Button>
                <Button 
                  component={Link} 
                  to="/tenants" 
                  color="inherit"
                  sx={{ mx: 1 }}
                >
                  Tenants
                </Button>
              </>
            )}
            <Button 
              component={Link} 
              to="/maintenance" 
              color="inherit"
              sx={{ mx: 1 }}
            >
              Maintenance
            </Button>
            <Button 
              component={Link} 
              to="/payments" 
              color="inherit"
              sx={{ mx: 1 }}
            >
              Payments
            </Button>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            color="inherit" 
            onClick={handleNotificationsOpen}
            sx={{ mx: 1 }}
            data-testid="notification-icon"
            aria-label="Show notifications"
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <IconButton 
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ ml: 1 }}
            aria-label="Account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
          >
            {user?.avatar ? (
              <Avatar 
                src={user.avatar} 
                alt={user.name || "User"} 
                sx={{ width: 32, height: 32 }}
              />
            ) : (
              <AccountCircleIcon />
            )}
          </IconButton>
        </Box>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          sx={{ mt: '45px' }}
        >
          <MenuItem 
            component={Link} 
            to="/profile" 
            onClick={handleMenuClose}
          >
            Profile
          </MenuItem>
          <MenuItem 
            component={Link} 
            to="/settings" 
            onClick={handleMenuClose}
          >
            Settings
          </MenuItem>
          <MenuItem 
            onClick={handleLogout}
          >
            Logout
          </MenuItem>
        </Menu>
        
        {isMobile && (
          <Menu
            anchorEl={mobileMenuAnchor}
            open={Boolean(mobileMenuAnchor)}
            onClose={handleMobileMenuClose}
            sx={{ mt: '45px' }}
          >
            <MenuItem 
              component={Link} 
              to="/dashboard" 
              onClick={handleMobileMenuClose}
            >
              Dashboard
            </MenuItem>
            {user?.role === 'landlord' && (
              <>
                <MenuItem 
                  component={Link} 
                  to="/properties" 
                  onClick={handleMobileMenuClose}
                >
                  Properties
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/tenants" 
                  onClick={handleMobileMenuClose}
                >
                  Tenants
                </MenuItem>
              </>
            )}
            <MenuItem 
              component={Link} 
              to="/maintenance" 
              onClick={handleMobileMenuClose}
            >
              Maintenance
            </MenuItem>
            <MenuItem 
              component={Link} 
              to="/payments" 
              onClick={handleMobileMenuClose}
            >
              Payments
            </MenuItem>
            <MenuItem 
              component={Link} 
              to="/profile" 
              onClick={handleMobileMenuClose}
            >
              Profile
            </MenuItem>
            <MenuItem 
              component={Link} 
              to="/settings" 
              onClick={handleMobileMenuClose}
            >
              Settings
            </MenuItem>
            <MenuItem 
              component={Link} 
              to="/support" 
              onClick={handleMobileMenuClose}
            >
              Support
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              Logout
            </MenuItem>
          </Menu>
        )}
        
        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={handleNotificationsClose}
          sx={{ mt: '45px' }}
        >
          <MenuItem onClick={handleNotificationsClose}>
            Notification 1
          </MenuItem>
          <MenuItem onClick={handleNotificationsClose}>
            Notification 2
          </MenuItem>
          <MenuItem onClick={handleNotificationsClose}>
            Notification 3
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;