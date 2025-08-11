// frontend/src/pages/TenantDetail.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Divider,
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
  IconButton
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Description as DescriptionIcon,
  Payment as PaymentIcon
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { useTenant, useApp } from "../context";

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
    const fetchTenant = async () => {
      try {
        setLoading(true);
        const data = await getTenant(id);
        setTenant(data);
        setEditData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
        });
        updatePageTitle(`Tenant: ${data.name}`);
      } catch (err) {
        setError("Failed to load tenant details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTenant();
  }, [id, getTenant, updatePageTitle]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle edit dialog
  const handleEditOpen = () => {
    setEditDialogOpen(true);
  };
  
  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditErrors({});
  };
  
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field changes
    if (editErrors[name]) {
      setEditErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleUpdateTenant = async () => {
    // Validation
    const errors = {};
    if (!editData.name) errors.name = "Name is required";
    if (!editData.email) errors.email = "Email is required";
    
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    
    setSubmitting(true);
    try {
      const updated = await updateTenant(id, editData);
      setTenant(updated);
      handleEditClose();
    } catch (err) {
      setEditErrors({ submit: err.message || "Failed to update tenant" });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle delete dialog
  const handleDeleteOpen = () => {
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
  };
  
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
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !tenant) {
    return (
      <Box mt={4} px={3}>
        <Alert severity="error">{error || "Tenant not found"}</Alert>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate("/tenants")}>
          Back to Tenants
        </Button>
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <PersonIcon fontSize="large" sx={{ mr: 2, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {tenant.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tenant.email} • {tenant.phone || "No phone"}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Button
            startIcon={<EditIcon />}
            variant="outlined"
            sx={{ mr: 1 }}
            onClick={handleEditOpen}
          >
            Edit
          </Button>
          <Button
            startIcon={<DeleteIcon />}
            variant="outlined"
            color="error"
            onClick={handleDeleteOpen}
          >
            Delete
          </Button>
        </Box>
      </Box>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="tenant tabs">
          <Tab label="Overview" />
          <Tab label="Payments" />
          <Tab label="Documents" />
          <Tab label="Activity" />
        </Tabs>
      </Box>
      
      {/* Tab Content */}
      <Box mb={4}>
        {/* Overview Tab */}
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
                    <Typography variant="body1">{tenant.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">{tenant.email}</Typography>
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
                    <Typography variant="body1">
                      {tenant.lease_start ? new Date(tenant.lease_start).toLocaleDateString() : "Not set"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Lease End
                    </Typography>
                    <Typography variant="body1">
                      {tenant.lease_end ? new Date(tenant.lease_end).toLocaleDateString() : "Not set"}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {/* Payments Tab */}
        {tabValue === 1 && (
          <Box textAlign="center" py={4}>
            <PaymentIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Payment history will be displayed here
            </Typography>
          </Box>
        )}
        
        {/* Documents Tab */}
        {tabValue === 2 && (
          <Box textAlign="center" py={4}>
            <DescriptionIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Documents will be displayed here
            </Typography>
          </Box>
        )}
        
        {/* Activity Tab */}
        {tabValue === 3 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              Activity log will be displayed here
            </Typography>
          </Box>
        )}
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
              value={editData.name || ''}
              onChange={handleEditChange}
              error={!!editErrors.name}
              helperText={editErrors.name}
            />
            <TextField
              name="email"
              label="Email Address"
              fullWidth
              margin="normal"
              value={editData.email || ''}
              onChange={handleEditChange}
              error={!!editErrors.email}
              helperText={editErrors.email}
            />
            <TextField
              name="phone"
              label="Phone Number"
              fullWidth
              margin="normal"
              value={editData.phone || ''}
              onChange={handleEditChange}
              error={!!editErrors.phone}
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
          <Button 
            onClick={handleUpdateTenant} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete tenant <strong>{tenant.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancel</Button>
          <Button 
            onClick={handleDeleteTenant} 
            color="error" 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Deleting...' : 'Delete Tenant'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TenantDetail;
