// frontend/src/pages/TenantDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Link as MuiLink,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Payment as PaymentIcon,
} from "@mui/icons-material";
import { Layout, PageHeader, Empty } from "../components";
import { useTenant, useApp } from "../context";

function fmtDate(d, { withTime = false } = {}) {
  if (!d) return "Not set";
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  const t = date.getTime();
  if (Number.isNaN(t)) return "Not set";
  return withTime ? date.toLocaleString() : date.toLocaleDateString();
}

function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updatePageTitle } = useApp();
  const { getTenant, updateTenant, deleteTenant } = useTenant();

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch tenant details
  useEffect(() => {
    let mounted = true;
    const fetchTenant = async () => {
      try {
        setLoading(true);
        const data = await getTenant(id);
        if (!mounted) return;
        setTenant(data);
        setEditData({
          name: data?.name || "",
          email: data?.email || "",
          phone: data?.phone || "",
        });
        updatePageTitle(`Tenant: ${data?.name || "#" + id}`);
      } catch (err) {
        if (!mounted) return;
        setError("Failed to load tenant details");
        // eslint-disable-next-line no-console
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTenant();
    return () => {
      mounted = false;
    };
  }, [id, getTenant, updatePageTitle]);

  // Derived collections (defensive)
  const payments = useMemo(() => Array.isArray(tenant?.payments) ? tenant.payments : [], [tenant]);
  const documents = useMemo(() => Array.isArray(tenant?.documents) ? tenant.documents : [], [tenant]);
  const activity = useMemo(() => Array.isArray(tenant?.activity) ? tenant.activity : [], [tenant]);

  // Handlers
  const handleTabChange = (_event, newValue) => setTabValue(newValue);

  const handleEditOpen = () => setEditDialogOpen(true);
  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditErrors({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
    if (editErrors[name]) setEditErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleUpdateTenant = async () => {
    const errors = {};
    if (!editData.name?.trim()) errors.name = "Name is required";
    if (!editData.email?.trim()) errors.email = "Email is required";
    if (Object.keys(errors).length) {
      setEditErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateTenant(id, editData);
      setTenant(updated || { ...tenant, ...editData });
      handleEditClose();
    } catch (err) {
      setEditErrors({ submit: err?.message || "Failed to update tenant" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOpen = () => setDeleteDialogOpen(true);
  const handleDeleteClose = () => setDeleteDialogOpen(false);

  const handleDeleteTenant = async () => {
    setSubmitting(true);
    try {
      await deleteTenant(id);
      navigate("/tenants");
    } catch (err) {
      setError("Failed to delete tenant");
    } finally {
      setSubmitting(false);
      handleDeleteClose();
    }
  };

  // Loading / Error states wrapped in Layout for consistency
  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !tenant) {
    return (
      <Layout>
        <PageHeader
          title="Tenant Detail"
          breadcrumbs={[{ text: "Dashboard", link: "/" }, { text: "Tenants", link: "/tenants" }, { text: "Detail" }]}
          actionText="Back to Tenants"
          onActionClick={() => navigate("/tenants")}
        />
        <Box mt={2} px={3}>
          <Alert severity="error">{error || "Tenant not found"}</Alert>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate("/tenants")}>
            Back to Tenants
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title={tenant.name || "Tenant"}
        subtitle={`${tenant.email || "No email"} • ${tenant.phone || "No phone"}`}
        breadcrumbs={[{ text: "Dashboard", link: "/" }, { text: "Tenants", link: "/tenants" }, { text: tenant.name || `#${id}` }]}
        actionText="Back"
        onActionClick={() => navigate("/tenants")}
      />

      <Box px={3} pb={4}>
        {/* Header Actions */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <PersonIcon fontSize="large" sx={{ mr: 2, color: "primary.main" }} />
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {tenant.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <MuiLink href={`mailto:${tenant.email}`} underline="hover">
                  {tenant.email}
                </MuiLink>{" "}
                • {tenant.phone || "No phone"}
              </Typography>
              <Box mt={1}>
                <Chip
                  size="small"
                  label={tenant.active ? "Active" : "Inactive"}
                  color={tenant.active ? "success" : "default"}
                />
              </Box>
            </Box>
          </Box>

          <Box>
            <Button startIcon={<EditIcon />} variant="outlined" sx={{ mr: 1 }} onClick={handleEditOpen}>
              Edit
            </Button>
            <Button startIcon={<DeleteIcon />} variant="outlined" color="error" onClick={handleDeleteOpen}>
              Delete
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="tenant tabs" variant="scrollable" scrollButtons="auto">
            <Tab label="Overview" />
            <Tab label={`Payments${payments.length ? ` (${payments.length})` : ""}`} />
            <Tab label={`Documents${documents.length ? ` (${documents.length})` : ""}`} />
            <Tab label={`Activity${activity.length ? ` (${activity.length})` : ""}`} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box mb={4}>
          {/* Overview */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2 }} elevation={0}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    Tenant Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Full Name
                      </Typography>
                      <Typography variant="body1">{tenant.name || "Not provided"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">{tenant.email || "Not provided"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">{tenant.phone || "Not provided"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        size="small"
                        label={tenant.active ? "Active" : "Inactive"}
                        color={tenant.active ? "success" : "default"}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2 }} elevation={0}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    Lease Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Property
                      </Typography>
                      <Typography variant="body1">{tenant.property || "Not assigned"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Unit
                      </Typography>
                      <Typography variant="body1">{tenant.unit || "Not assigned"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Lease Start
                      </Typography>
                      <Typography variant="body1">{fmtDate(tenant.lease_start)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Lease End
                      </Typography>
                      <Typography variant="body1">{fmtDate(tenant.lease_end)}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Payments */}
          {tabValue === 1 && (
            <Paper sx={{ p: 3, borderRadius: 2 }} elevation={0}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Payments
              </Typography>
              {payments.length === 0 ? (
                <Empty
                  title="No payments recorded"
                  message="When payments are logged for this tenant, they’ll appear here."
                  icon={<PaymentIcon sx={{ fontSize: 56 }} />}
                />
              ) : (
                <List disablePadding>
                  {payments.map((pmt, idx) => (
                    <ListItem
                      key={pmt.id || idx}
                      divider={idx !== payments.length - 1}
                      sx={{ px: 0, py: 1.5 }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1" fontWeight={600}>
                              {pmt.amount != null ? `$${Number(pmt.amount).toFixed(2)}` : "—"}
                            </Typography>
                            <Chip
                              size="small"
                              label={pmt.status ? String(pmt.status).replace(/_/g, " ") : "Unknown"}
                              color={
                                pmt.status === "paid"
                                  ? "success"
                                  : pmt.status === "overdue"
                                  ? "error"
                                  : "default"
                              }
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {fmtDate(pmt.date)} • {pmt.method || "Method N/A"}
                            {pmt.reference ? ` • Ref: ${pmt.reference}` : ""}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          )}

          {/* Documents */}
          {tabValue === 2 && (
            <Paper sx={{ p: 3, borderRadius: 2 }} elevation={0}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Documents
              </Typography>
              {documents.length === 0 ? (
                <Empty
                  title="No documents uploaded"
                  message="Lease agreements and other files will appear here when uploaded."
                  icon={<DescriptionIcon sx={{ fontSize: 56 }} />}
                />
              ) : (
                <List disablePadding>
                  {documents.map((doc, idx) => (
                    <ListItem
                      key={doc.id || idx}
                      divider={idx !== documents.length - 1}
                      sx={{ px: 0, py: 1.25 }}
                    >
                      <ListItemText
                        primary={
                          <MuiLink href={doc.url} target="_blank" rel="noopener noreferrer" underline="hover">
                            {doc.name || doc.type || "Document"}
                          </MuiLink>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {doc.type || "File"} • Uploaded {fmtDate(doc.uploaded_at, { withTime: true })}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          )}

          {/* Activity */}
          {tabValue === 3 && (
            <Paper sx={{ p: 3, borderRadius: 2 }} elevation={0}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Activity
              </Typography>
              {activity.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No recent activity.
                </Typography>
              ) : (
                <List disablePadding>
                  {activity.map((evt, idx) => (
                    <ListItem key={evt.id || idx} divider={idx !== activity.length - 1} sx={{ px: 0 }}>
                      <ListItemText
                        primary={evt.text || "Event"}
                        secondary={<Typography variant="body2">{fmtDate(evt.timestamp, { withTime: true })}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          )}
        </Box>
      </Box>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Tenant</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <TextField
              name="name"
              label="Full Name"
              fullWidth
              margin="normal"
              value={editData.name || ""}
              onChange={handleEditChange}
              error={Boolean(editErrors.name)}
              helperText={editErrors.name}
            />
            <TextField
              name="email"
              label="Email Address"
              fullWidth
              margin="normal"
              value={editData.email || ""}
              onChange={handleEditChange}
              error={Boolean(editErrors.email)}
              helperText={editErrors.email}
            />
            <TextField
              name="phone"
              label="Phone Number"
              fullWidth
              margin="normal"
              value={editData.phone || ""}
              onChange={handleEditChange}
              error={Boolean(editErrors.phone)}
              helperText={editErrors.phone}
            />

            {editErrors.submit && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {editErrors.submit}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleUpdateTenant} variant="contained" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete tenant{" "}
            <strong>{tenant.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancel</Button>
          <Button onClick={handleDeleteTenant} color="error" variant="contained" disabled={submitting}>
            {submitting ? "Deleting..." : "Delete Tenant"}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default TenantDetail;
