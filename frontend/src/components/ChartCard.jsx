import React from 'react';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function ChartCard({ title, data, dataKey = 'value', xAxisKey = 'date', color, subtitle, height = 200 }) {
  const theme = useTheme();
  const chartColor = color || theme.palette.primary.main;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {subtitle}
          </Typography>
        )}
        <Box sx={{ height: height, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }} 
                axisLine={false}
                tickLine={false}
                style={{ fontSize: '0.75rem' }}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme.palette.background.paper,
                  border: 'none',
                  borderRadius: 8,
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke={chartColor} 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: chartColor }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}