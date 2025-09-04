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
