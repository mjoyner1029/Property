import React from 'react';
import { Box, Typography, Paper, IconButton, Avatar, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HomeIcon from '@mui/icons-material/Home';
import EngineeringIcon from '@mui/icons-material/Engineering';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import StatusBadge from './StatusBadge';
import { format, formatDistanceToNow } from 'date-fns';

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return '#EF4444';
    case 'medium':
      return '#F59E0B';
    case 'low':
      return '#3B82F6';
    default:
      return '#6B7280';
  }
};

const MaintenanceRequestCard = ({
  id,
  title,
  description,
  status,
  priority,
  propertyName,
  unitNumber,
  createdAt,
  assignedTo,
  images = [],
  onClick,
  onMenuClick
}) => {
  const date = new Date(createdAt);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });
  const formattedDate = format(date, 'MMM d, yyyy');
  const priorityColor = getPriorityColor(priority);
  
  const handleClick = () => {
    if (onClick) onClick(id);
  };
  
  const handleMenuClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onMenuClick) onMenuClick(e, id);
  };
  
  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        height: '100%',
        backgroundColor: '#1F2327',
        color: '#F5F5F5',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
      onClick={handleClick}
      component={id ? Link : 'div'}
      to={id ? `/maintenance/${id}` : undefined}
      style={{ textDecoration: 'none' }}
    >
      {/* Card Header */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <StatusBadge status={status} />
          {priority && (
            <Tooltip title={`Priority: ${priority}`}>
              <PriorityHighIcon sx={{ color: priorityColor, fontSize: '1rem' }} />
            </Tooltip>
          )}
        </Box>
        
        <IconButton size="small" onClick={handleMenuClick}>
          <MoreVertIcon />
        </IconButton>
      </Box>
      
      {/* Card Content */}
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="h3" sx={{ mb: 1 }} noWrap>
          {title}
        </Typography>
        
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {description}
        </Typography>
        
        {/* Property Details */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <HomeIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
          <Typography variant="body2" noWrap>
            {propertyName} {unitNumber && `• Unit ${unitNumber}`}
          </Typography>
        </Box>
        
        {/* Request Info */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
          <Tooltip title={formattedDate}>
            <Typography variant="body2" color="text.secondary">
              {timeAgo}
            </Typography>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Card Footer */}
      {assignedTo && (
        <Box sx={{ 
          p: 2, 
          pt: 0,
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EngineeringIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Assigned to:
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <Avatar
              src={assignedTo.avatar}
              alt={assignedTo.name}
              sx={{ width: 24, height: 24, mr: 1 }}
            />
            <Typography variant="body2">
              {assignedTo.name}
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default MaintenanceRequestCard;