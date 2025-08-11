import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  change,
  changeLabel,
  iconColor = '#D97862',
  trendColor,
  trendDirection,
  footer
}) => {
  // Determine trend color if not specified
  const getTrendColor = () => {
    if (trendColor) return trendColor;
    if (trendDirection === 'up') return '#10B981';
    if (trendDirection === 'down') return '#EF4444';
    return '#6B7280';
  };

  // Determine trend icon
  const getTrendIcon = () => {
    if (trendDirection === 'up') return <TrendingUpIcon fontSize="small" />;
    if (trendDirection === 'down') return <TrendingDownIcon fontSize="small" />;
    return null;
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 3, 
        height: '100%', 
        backgroundColor: '#1F2327',
        color: '#F5F5F5',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" color="text.secondary">
          {title}
        </Typography>
        {icon && (
          <Box sx={{ 
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: `${iconColor}20`, // 20% opacity version of the color
          }}>
            {icon}
          </Box>
        )}
      </Box>
      
      <Typography variant="h4" component="div" sx={{ fontWeight: 'medium', mb: 1 }}>
        {value}
      </Typography>
      
      {(change || trendDirection) && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          color: getTrendColor(),
          mb: 2
        }}>
          {getTrendIcon()}
          <Typography variant="body2" sx={{ ml: 0.5 }}>
            {change}
          </Typography>
          {changeLabel && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
              {changeLabel}
            </Typography>
          )}
        </Box>
      )}
      
      {footer && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="body2" color="text.secondary">
            {footer}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default StatCard;