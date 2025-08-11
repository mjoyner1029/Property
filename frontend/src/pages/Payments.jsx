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
  TableContainer,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { usePayment, useApp } from "../context";
import { formatCurrency } from "../utils/formatters";

export default function Payments() {
  const navigate = useNavigate();
  const { updatePageTitle } = useApp();
  const { payments, loading, error, fetchPayments } = usePayment();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    updatePageTitle("Payments");
    if (payments.length === 0 && !loading) {
      fetchPayments();
    }
  }, [updatePageTitle, fetchPayments, payments.length, loading]);

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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={600}>
            Payment History
          </Typography>
          
          <Button 
            variant="contained"
            onClick={() => setCreateDialogOpen(true)}
          >
            Record Payment
          </Button>
        </Box>
        
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
        

        
        {/* Create Payment Dialog */}
        <CreatePaymentDialog 
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
        />
      </Box>
    </Container>
  );
}

// Create Payment Dialog Component
function CreatePaymentDialog({ open, onClose }) {
  const { createPayment } = usePayment();
  const [formData, setFormData] = useState({
    tenant_id: '',
    amount: '',
    due_date: '',
    description: 'Rent',
    status: 'pending'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async () => {
    // Validate form
    const errors = {};
    if (!formData.tenant_id) errors.tenant_id = 'Tenant is required';
    if (!formData.amount || formData.amount <= 0) errors.amount = 'Valid amount is required';
    if (!formData.due_date) errors.due_date = 'Due date is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await createPayment({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      onClose();
      
      // Reset form data
      setFormData({
        tenant_id: '',
        amount: '',
        due_date: '',
        description: 'Rent',
        status: 'pending'
      });
    } catch (err) {
      console.error('Error creating payment:', err);
      setFormErrors({ submit: err.message || 'Failed to create payment' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Record New Payment</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              name="tenant_id"
              label="Tenant ID" // Would be better as a dropdown of tenants
              fullWidth
              value={formData.tenant_id}
              onChange={handleChange}
              error={!!formErrors.tenant_id}
              helperText={formErrors.tenant_id}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="amount"
              label="Amount"
              fullWidth
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              value={formData.amount}
              onChange={handleChange}
              error={!!formErrors.amount}
              helperText={formErrors.amount}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="due_date"
              label="Due Date"
              fullWidth
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.due_date}
              onChange={handleChange}
              error={!!formErrors.due_date}
              helperText={formErrors.due_date}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="description"
              label="Description"
              fullWidth
              value={formData.description}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleChange}
              >
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {formErrors.submit && (
            <Grid item xs={12}>
              <Alert severity="error">{formErrors.submit}</Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={submitting}
        >
          {submitting ? 'Creating...' : 'Record Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
