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
