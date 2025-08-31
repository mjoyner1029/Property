// frontend/src/pages/Payments.jsx
import React, { useEffect, useMemo, useState } from "react";
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
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Layout, PageHeader, Empty } from "../components";
import { usePayment, useApp, useTenant } from "../context";
import { formatCurrency } from "../utils/formatters";

function statusColor(status) {
  const s = (status || "").toString().toLowerCase();
  if (s === "paid") return "success";
  if (s === "pending") return "warning";
  if (s === "overdue") return "error";
  return "default";
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function Payments() {
  const navigate = useNavigate();
  const { updatePageTitle } = useApp();
  const { payments, loading, error, fetchPayments } = usePayment();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    updatePageTitle("Payments");
    // Always fetch to ensure freshness
    fetchPayments();
  }, [updatePageTitle, fetchPayments]);

  const openDialog = () => setCreateDialogOpen(true);
  const closeDialog = () => setCreateDialogOpen(false);

  return (
    <Layout>
      <PageHeader
        title="Payments"
        subtitle="Track rent and other payment records"
        breadcrumbs={[{ text: "Dashboard", link: "/" }, { text: "Payments" }]}
        actionText="Record Payment"
        onActionClick={openDialog}
      />

      <Box px={3} pb={4}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {String(error)}
          </Alert>
        ) : (payments || []).length === 0 ? (
          <Empty
            title="No Payment Records"
            message="Create a payment to get started."
            actionText="Record Payment"
            onActionClick={openDialog}
          />
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "background.paper" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(payments || []).map((p) => (
                  <TableRow
                    key={p.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => {
                      navigate(`/payments/${p.id}`);
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2">{p.tenant_name || "—"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency
                          ? formatCurrency(Number(p.amount) || 0)
                          : `$${Number(p.amount || 0).toFixed(2)}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={(p.status || "").toString().replace(/_/g, " ") || "—"}
                        color={statusColor(p.status)}
                        size="small"
                        sx={{ height: 24, fontSize: "0.75rem", borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(p.due_date)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {p.description || "—"}
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
          onClose={closeDialog}
          onCreated={fetchPayments}
        />
      </Box>
    </Layout>
  );
}

/** Create Payment Dialog */
function CreatePaymentDialog({ open, onClose, onCreated }) {
  const { createPayment, fetchPayments } = usePayment();
  const { tenants = [], fetchTenants } = useTenant() || {};
  const [formData, setFormData] = useState({
    tenant_id: "",
    amount: "",
    due_date: "",
    description: "Rent",
    status: "pending",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const hasTenantList = useMemo(() => Array.isArray(tenants) && tenants.length > 0, [tenants]);

  useEffect(() => {
    // Try to populate tenants when the dialog opens
    if (open && !hasTenantList && typeof fetchTenants === "function") {
      fetchTenants().catch(() => {});
    }
  }, [open, hasTenantList, fetchTenants]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.tenant_id) errors.tenant_id = "Tenant is required";
    const amt = Number(formData.amount);
    if (!amt || amt <= 0) errors.amount = "Valid amount is required";
    if (!formData.due_date) errors.due_date = "Due date is required";
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setSubmitting(true);
    try {
      await createPayment({
        ...formData,
        amount: Number(formData.amount),
      });
      // Refresh list in parent + local safety
      if (typeof onCreated === "function") await onCreated();
      else await fetchPayments();
      // Reset and close
      setFormData({
        tenant_id: "",
        amount: "",
        due_date: "",
        description: "Rent",
        status: "pending",
      });
      onClose();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error creating payment:", err);
      setFormErrors({ submit: err?.message || "Failed to create payment" });
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
            {hasTenantList ? (
              <FormControl fullWidth error={Boolean(formErrors.tenant_id)}>
                <InputLabel>Tenant</InputLabel>
                <Select
                  name="tenant_id"
                  label="Tenant"
                  value={formData.tenant_id}
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Select a tenant</em>
                  </MenuItem>
                  {tenants.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name || t.email || `Tenant #${t.id}`}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.tenant_id && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {formErrors.tenant_id}
                  </Typography>
                )}
              </FormControl>
            ) : (
              <TextField
                name="tenant_id"
                label="Tenant ID"
                fullWidth
                value={formData.tenant_id}
                onChange={handleChange}
                error={Boolean(formErrors.tenant_id)}
                helperText={formErrors.tenant_id}
              />
            )}
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
              error={Boolean(formErrors.amount)}
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
              error={Boolean(formErrors.due_date)}
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
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {submitting ? "Creating..." : "Record Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
