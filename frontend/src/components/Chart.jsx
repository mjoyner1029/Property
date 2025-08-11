import React, { useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area
} from 'recharts';
import { format, parseISO } from 'date-fns';

const Chart = ({
  data = [],
  xKey = 'date',
  yKey = 'value',
  color = '#3B82F6',
  height = '100%',
  lineOnly = false,
  showGrid = true,
  areaOpacity = 0.1,
  dateFormat = 'MMM dd',
  showTooltip = true
}) => {
  const theme = useTheme();
  
  // Format dates for display
  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedDate: item[xKey] && typeof item[xKey] === 'string' 
        ? format(parseISO(item[xKey]), dateFormat)
        : item[xKey]
    }));
  }, [data, xKey, dateFormat]);

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart
          data={formattedData}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid 
              stroke={theme.palette.divider} 
              strokeDasharray="3 3" 
              vertical={false}
            />
          )}
          
          <XAxis 
            dataKey="formattedDate"
            axisLine={false}
            tickLine={false}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            dy={10}
          />
          
          <YAxis 
            hide={!showGrid}
            axisLine={false}
            tickLine={false}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            dx={-10}
          />
          
          {showTooltip && (
            <Tooltip 
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
                borderRadius: 8,
                boxShadow: theme.shadows[3],
                color: theme.palette.text.primary
              }}
              itemStyle={{ color: color }}
              formatter={(value) => [value, yKey]}
              labelFormatter={(label) => label}
            />
          )}
          
          {!lineOnly && (
            <defs>
              <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
          )}
          
          {!lineOnly && (
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={color}
              fillOpacity={areaOpacity}
              fill={`url(#gradient-${color.replace('#', '')})`}
            />
          )}
          
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={color}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 1 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default Chart;