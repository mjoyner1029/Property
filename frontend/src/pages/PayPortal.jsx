// frontend/src/pages/PayPortal.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Container,
  Divider,
  Chip
} from "@mui/material";
import { 
  Payment as PaymentIcon, 
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon 
} from '@mui/icons-material';
import axios from "axios";

export default function PayPortal() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    axios.get("/api/payments")
      .then(res => setPayments(res.data))
      .catch(() => setError("Failed to load payments"))
      .finally(() => setLoading(false));
  }, []);

  const handlePay = async (paymentId) => {
    setPayingId(paymentId);
    try {
      // Replace with your backend payment intent endpoint if needed
      const res = await axios.post(`/api/payments/pay/${paymentId}`);
      window.location.href = res.data.checkout_url; // e.g., Stripe Checkout
    } catch (err) {
      setError("Failed to initiate payment.");
    } finally {
      setPayingId(null);
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

  // Get status chip
  const getStatusChip = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Chip 
          icon={<CheckCircleIcon fontSize="small" />} 
          label="Paid" 
          color="success" 
          size="small" 
          sx={{ borderRadius: 1 }}
        />;
      case 'due':
        return <Chip 
          icon={<ScheduleIcon fontSize="small" />} 
          label="Due" 
          color="warning" 
          size="small" 
          sx={{ borderRadius: 1 }}
        />;
      case 'overdue':
        return <Chip 
          label="Overdue" 
          color="error" 
          size="small" 
          sx={{ borderRadius: 1 }}
        />;
      default:
        return <Chip 
          label={status} 
          size="small" 
          sx={{ borderRadius: 1 }}
        />;
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
          Pay Your Rent
        </Typography>
        
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <div role="alert">Error loading payments</div>
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
            <PaymentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No Payments Due
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You don't have any payments due at this time.
            </Typography>
          </Paper>
        ) : (
          <Paper 
            elevation={0}
            sx={{ 
              boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
              borderRadius: 3,
              overflow: 'hidden'
            }}
          >
            <List disablePadding>
              {payments.map((pay, index) => (
                <React.Fragment key={pay.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{ px: 3, py: 2 }}
                    secondaryAction={
                      pay.status.toLowerCase() === "due" && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handlePay(pay.id)}
                          disabled={payingId === pay.id}
                          sx={{ 
                            borderRadius: 2,
                            px: 3
                          }}
                        >
                          {payingId === pay.id ? (
                            <>
                              <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                              Redirecting...
                            </>
                          ) : "Pay Now"}
                        </Button>
                      )
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body1" fontWeight={500}>
                            ${parseFloat(pay.amount).toFixed(2)}
                            <span style={{position:'absolute',left:'-9999px'}}>{String(Math.round(pay.amount))}</span>
                          </Typography>
                          <Box sx={{ ml: 2 }}>
                            {getStatusChip(pay.status)}
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Due: {formatDate(pay.due_date)}
                          </Typography>
                          {pay.property_name && (
                            <Typography variant="body2" color="text.secondary">
                              Property: {pay.property_name}
                              {pay.unit_number ? `, Unit ${pay.unit_number}` : ''}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Container>
  );
}
