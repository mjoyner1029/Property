// frontend/src/pages/Payments.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  Container,
  TableContainer
} from "@mui/material";
import axios from "axios";
import { formatCurrency } from "../utils/formatters";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get("/api/payments")
      .then(res => setPayments(res.data))
      .catch(() => setError("Failed to load payments"))
      .finally(() => setLoading(false));
  }, []);

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
          Payment History
        </Typography>
        
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : payments.length === 0 ? (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
              borderRadius: 3
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No Payment Records
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              There are no payment records to display at this time.
            </Typography>
          </Paper>
        ) : (
          <TableContainer 
            component={Paper} 
            elevation={0}
            sx={{ 
              boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
              borderRadius: 3,
              overflow: 'hidden'
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'background.paperAlt' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p) => (
                  <TableRow 
                    key={p.id}
                    hover
                    sx={{ 
                      '&:last-child td, &:last-child th': { 
                        border: 0 
                      } 
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2">{p.tenant_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        ${parseFloat(p.amount).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={p.status} 
                        color={getStatusColor(p.status)} 
                        size="small"
                        sx={{ 
                          height: 24, 
                          fontSize: '0.75rem',
                          borderRadius: 1
                        }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(p.due_date)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
}
