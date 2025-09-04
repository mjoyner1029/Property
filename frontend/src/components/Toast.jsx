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
