import React from 'react';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';

export default function StatsCard({ title, value, icon, trendValue, trendLabel, trendUp }) {
  const theme = useTheme();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          {icon}
        </Box>
        
        <Typography variant="h4" fontWeight="bold" mb={1}>
          {value}
        </Typography>
        
        {(trendValue || trendLabel) && (
          <Box display="flex" alignItems="center">
            {trendUp !== undefined && (
              <Box 
                component="span" 
                sx={{ 
                  color: trendUp ? theme.palette.success.main : theme.palette.error.main,
                  mr: 1,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {trendUp ? '↑' : '↓'}
              </Box>
            )}
            <Typography variant="body2" color="text.secondary">
              {trendValue && `${trendValue} `}{trendLabel}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}