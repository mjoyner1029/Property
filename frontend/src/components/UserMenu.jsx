import React from 'react';
import { IconButton, Avatar, Menu, MenuItem, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context';

/**
 * UserMenu component displays user avatar and dropdown menu
 */
export default function UserMenu() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleNavigate = (path) => {
    navigate(path);
    handleClose();
  };
  
  const handleLogout = () => {
    logout();
    handleClose();
  };
  
  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="small"
        sx={{ ml: 2 }}
        aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
      >
        <Avatar 
          sx={{ width: 32, height: 32 }}
          alt={user?.name || 'User'}
          src={user?.avatar || ''}
        >
          {user?.name?.charAt(0) || 'U'}
        </Avatar>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleNavigate('/profile')}>
          Profile
        </MenuItem>
        <MenuItem onClick={() => handleNavigate('/settings')}>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
