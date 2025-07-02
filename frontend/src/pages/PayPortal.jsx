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
} from "@mui/material";
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Pay Your Rent</Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Paper sx={{ mt: 2 }}>
          <List>
            {payments.map((pay) => (
              <ListItem key={pay.id} secondaryAction={
                pay.status === "due" && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handlePay(pay.id)}
                    disabled={payingId === pay.id}
                  >
                    {payingId === pay.id ? "Redirecting..." : "Pay Now"}
                  </Button>
                )
              }>
                <ListItemText
                  primary={`Amount: $${pay.amount}`}
                  secondary={`Due: ${pay.due_date} – Status: ${pay.status}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
