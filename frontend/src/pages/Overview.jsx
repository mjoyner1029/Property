// frontend/src/pages/Overview.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button,
  Paper,
  Divider,
  CircularProgress
} from "@mui/material";
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Mock data
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const incomeData = [
  { name: 'Rent', value: 12000 },
  { name: 'Deposits', value: 2000 },
  { name: 'Fees', value: 800 },
  { name: 'Other', value: 500 },
];

const expensesData = [
  { name: 'Mortgage', value: 5000 },
  { name: 'Maintenance', value: 2500 },
  { name: 'Insurance', value: 1200 },
  { name: 'Property Tax', value: 3000 },
];

const monthlyData = [
  { name: 'Jan', income: 9500, expenses: 7500 },
  { name: 'Feb', income: 9800, expenses: 7200 },
  { name: 'Mar', income: 9700, expenses: 8100 },
  { name: 'Apr', income: 9900, expenses: 7800 },
  { name: 'May', income: 10200, expenses: 7400 },
  { name: 'Jun', income: 10500, expenses: 7900 },
  { name: 'Jul', income: 10800, expenses: 8200 },
  { name: 'Aug', income: 11000, expenses: 7500 },
  { name: 'Sep', income: 11200, expenses: 7700 },
  { name: 'Oct', income: 11500, expenses: 8000 },
  { name: 'Nov', income: 11700, expenses: 8100 },
  { name: 'Dec', income: 12000, expenses: 8500 },
];

const Overview = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Calculate total income, expenses and profit
  const totalIncome = incomeData.reduce((sum, item) => sum + item.value, 0);
  const totalExpenses = expensesData.reduce((sum, item) => sum + item.value, 0);
  const profit = totalIncome - totalExpenses;

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={theme.palette.text.primary}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name} ($${value.toLocaleString()})`}
      </text>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <PageHeader title="Financial Overview" />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Total Income</Typography>
                      <Typography variant="h4" color="text.primary">${totalIncome.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ backgroundColor: 'success.light', p: 1.5, borderRadius: '50%' }}>
                      <MoneyIcon sx={{ color: 'success.main' }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Total Expenses</Typography>
                      <Typography variant="h4" color="text.primary">${totalExpenses.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ backgroundColor: 'error.light', p: 1.5, borderRadius: '50%' }}>
                      <TrendingDownIcon sx={{ color: 'error.main' }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Net Profit</Typography>
                      <Typography variant="h4" color={profit >= 0 ? 'success.main' : 'error.main'}>
                        ${profit.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ backgroundColor: profit >= 0 ? 'success.light' : 'error.light', p: 1.5, borderRadius: '50%' }}>
                      {profit >= 0 ? 
                        <TrendingUpIcon sx={{ color: 'success.main' }} /> : 
                        <TrendingDownIcon sx={{ color: 'error.main' }} />}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts Section */}
          <Grid container spacing={3}>
            {/* Income Breakdown */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Income Breakdown</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={<CustomPieLabel />}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {incomeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            
            {/* Expenses Breakdown */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Expenses Breakdown</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={<CustomPieLabel />}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expensesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            
            {/* Monthly Income vs Expenses */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Monthly Income vs Expenses</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value}`} />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#00C49F" />
                      <Bar dataKey="expenses" name="Expenses" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Overview;
