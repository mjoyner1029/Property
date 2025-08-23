// frontend/src/pages/MaintenanceDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListSubheader,
  IconButton,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
  ChatBubble as ChatBubbleIcon,
  Send as SendIcon,
  Plumbing as PlumbingIcon,
  ElectricalServices as ElectricalServicesIcon,
  AcUnit as HvacIcon,
  DoorFront as DoorFrontIcon,
  Chair as ChairIcon,
  Kitchen as KitchenIcon,
  PestControl as PestControlIcon,
  Home as HomeIcon,
  Warning as WarningIcon,
  HomeRepairService as HomeRepairServiceIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { Layout, PageHeader } from "../components";
import { useMaintenance, useApp } from "../context";

const STATUS_OPTIONS = [
  { value: "open", label: "Open", color: "warning" },
  { value: "in_progress", label: "In Progress", color: "info" },
  { value: "completed", label: "Completed", color: "success" },
  { value: "cancelled", label: "Cancelled", color: "error" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "success" },
  { value: "medium", label: "Medium", color: "info" },
  { value: "high", label: "High", color: "warning" },
  { value: "emergency", label: "Emergency", color: "error" },
];

// Same catalogue shape as the listing page, to keep values consistent.
const MAINTENANCE_CATALOG = [
  {
    header: "Plumbing",
    items: [
      ["plumbing_leaking", "Leaking faucet or pipe"],
      ["plumbing_clogged", "Clogged toilet or drain"],
      ["plumbing_no_hot_water", "No hot water"],
      ["plumbing_running_toilet", "Running toilet"],
      ["plumbing_low_pressure", "Low water pressure"],
      ["plumbing_disposal", "Broken garbage disposal"],
      ["plumbing_water_heater", "Water heater issue"],
    ],
  },
  {
    header: "Electrical",
    items: [
      ["electrical_no_power", "No power in outlet or room"],
      ["electrical_light_fixture", "Light fixture not working"],
      ["electrical_circuit_breaker", "Circuit breaker tripping"],
      ["electrical_fan", "Broken ceiling fan"],
      ["electrical_power_surge", "Power surge or flickering lights"],
      ["electrical_smoke_detector", "Smoke detector not working"],
    ],
  },
  {
    header: "HVAC",
    items: [
      ["hvac_no_heat", "No heat"],
      ["hvac_no_ac", "No A/C"],
      ["hvac_noise", "Strange HVAC noise"],
      ["hvac_thermostat", "Thermostat not working"],
      ["hvac_filter", "Air filter replacement"],
    ],
  },
  {
    header: "Doors, Windows & Locks",
    items: [
      ["door_broken", "Broken or stuck door"],
      ["lock_not_working", "Lock not working"],
      ["lock_lost_key", "Lost key or lockout"],
      ["window_stuck", "Window won't open/close"],
      ["window_broken", "Broken screen or cracked window"],
    ],
  },
  {
    header: "Interior & Structural",
    items: [
      ["interior_wall_ceiling", "Wall or ceiling damage"],
      ["interior_floor", "Floor damage"],
      ["interior_cabinet", "Cabinet/drawer broken"],
      ["interior_paint", "Paint peeling"],
      ["interior_mold", "Mold or mildew"],
    ],
  },
  {
    header: "Appliances",
    items: [
      ["appliance_refrigerator", "Refrigerator not cooling"],
      ["appliance_stove", "Stove/oven not working"],
      ["appliance_washer_dryer", "Washer/dryer issue"],
      ["appliance_dishwasher", "Dishwasher not draining"],
      ["appliance_microwave", "Microwave issue"],
    ],
  },
  {
    header: "Pest & Infestation",
    items: [
      ["pest_insects_rodents", "Roaches, ants, or rodents"],
      ["pest_termite", "Termite concern"],
      ["pest_bees", "Bees/wasps"],
      ["pest_bedbugs", "Bed bugs"],
      ["pest_fleas", "Fleas"],
    ],
  },
  {
    header: "Exterior",
    items: [
      ["exterior_roof", "Roof leak"],
      ["exterior_gutter", "Broken gutter"],
      ["exterior_yard", "Yard maintenance"],
      ["exterior_lighting", "Exterior lighting issue"],
      ["exterior_flooding", "Flooding"],
    ],
  },
  {
    header: "Emergency / Safety",
    headerProps: { sx: { bgcolor: "error.light", color: "primary.contrastText", fontWeight: "bold" } },
    items: [
      ["emergency_gas", "Gas leak"],
      ["emergency_fire_alarm", "Fire alarm issue"],
      ["emergency_carbon_monoxide", "Carbon monoxide detector issue"],
      ["emergency_lockout", "Lockout"],
      ["emergency_security", "Broken security feature"],
    ],
  },
];

function getMaintenanceTypeIcon(type) {
  if (!type) return <HomeRepairServiceIcon />;
  if (type.startsWith("plumbing")) return <PlumbingIcon />;
  if (type.startsWith("electrical")) return <ElectricalServicesIcon />;
  if (type.startsWith("hvac")) return <HvacIcon />;
  if (type.startsWith("door") || type.startsWith("window") || type.startsWith("lock"))
    return <DoorFrontIcon />;
  if (type.startsWith("interior")) return <ChairIcon />;
  if (type.startsWith("appliance")) return <KitchenIcon />;
  if (type.startsWith("pest")) return <PestControlIcon />;
  if (type.startsWith("exterior")) return <HomeIcon />;
  if (type.startsWith("emergency")) return <WarningIcon />;
  return <HomeRepairServiceIcon />;
}

function getMaintenanceTypeLabel(type) {
  if (!type) return "Other";
  const parts = type.split("_");
  if (parts.length <= 1) return type;
  const category = parts[0];
  const rest = parts.slice(1).join("_").replace(/_/g, " ");
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${cap(category)}: ${rest}`;
}

function fmtDate(d) {
  if (!d) return "N/A";
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  const t = date.getTime();
  if (Number.isNaN(t)) return "N/A";
  return date.toLocaleString();
}

export default function MaintenanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { maintenanceRequests, updateRequest, deleteRequest, fetchRequests, addComment } =
    useMaintenance();
  const { updatePageTitle } = useApp();

  const [request, setRequest] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editData, setEditData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Keep page title stable and ensure requests are available
  useEffect(() => {
    updatePageTitle("Maintenance Detail");
    // Ensure context is populated; safe if it already is.
    fetchRequests().finally(() => {
      setLocalLoading(false);
    });
  }, [updatePageTitle, fetchRequests]);

  // Derive the request from context whenever list or id changes
  useEffect(() => {
    const r = (maintenanceRequests || []).find(
      (x) => String(x.id) === String(id)
    );
    if (r) {
      setRequest(r);
      setError(null);
      setEditData({
        title: r.title || "",
        description: r.description || "",
        priority: r.priority || "medium",
        status: r.status || "open",
        maintenance_type: r.maintenance_type || "",
      });
      updatePageTitle(`Maintenance #${r.id}`);
    }
  }, [maintenanceRequests, id, updatePageTitle]);

  const statusData = useMemo(() => {
    if (!request) return null;
    return (
      STATUS_OPTIONS.find((o) => o.value === request.status) || {
        label: request.status || "Unknown",
        color: "default",
      }
    );
  }, [request]);

  const priorityData = useMemo(() => {
    if (!request) return null;
    return (
      PRIORITY_OPTIONS.find((o) => o.value === request.priority) || {
        label: request.priority || "Unknown",
        color: "default",
      }
    );
  }, [request]);

  const normalizedImages = useMemo(() => {
    if (!request?.images) return [];
    return request.images
      .map((img) => {
        if (typeof img === "string") return img;
        if (img?.url) return img.url;
        if (img?.src) return img.src;
        return null;
      })
      .filter(Boolean);
  }, [request]);

  const handleEditOpen = () => {
    setEditDialogOpen(true);
    setFormErrors({});
  };
  const handleEditClose = () => setEditDialogOpen(false);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Save full edits (validates title/description)
  const handleUpdateRequest = async () => {
    const errors = {};
    if (!editData.title) errors.title = "Title is required";
    if (!editData.description) errors.description = "Description is required";
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateRequest(id, editData);
      if (updated) {
        setRequest(updated);
      } else {
        await fetchRequests();
      }
      handleEditClose();
    } catch (err) {
      setFormErrors({ submit: err?.message || "Failed to update request" });
    } finally {
      setSubmitting(false);
    }
  };

  // Quick status updates without requiring title/description
  const quickUpdateStatus = async (nextStatus) => {
    if (!request) return;
    setSubmitting(true);
    try {
      const partial = { status: nextStatus };
      const updated = await updateRequest(id, partial);
      if (updated) {
        setRequest(updated);
      } else {
        await fetchRequests();
      }
    } catch {
      setError("Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOpen = () => setDeleteDialogOpen(true);
  const handleDeleteClose = () => setDeleteDialogOpen(false);

  const handleDeleteRequest = async () => {
    setSubmitting(true);
    try {
      await deleteRequest(id);
      navigate("/maintenance");
    } catch {
      setError("Failed to delete maintenance request");
    } finally {
      setSubmitting(false);
      handleDeleteClose();
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    // Prefer context addComment if available; otherwise optimistic local append.
    try {
      if (typeof addComment === "function") {
        await addComment(id, text);
        await fetchRequests();
      } else {
        const now = new Date().toISOString();
        setRequest((prev) => ({
          ...prev,
          comments: [
            ...(prev?.comments || []),
            { user_name: "You", created_at: now, text },
          ],
        }));
      }
      setCommentText("");
    } catch (err) {
      setError(err?.message || "Failed to add comment");
    }
  };

  if (localLoading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !request) {
    return (
      <Layout>
        <PageHeader
          title="Maintenance Detail"
          breadcrumbs={[{ text: "Dashboard", link: "/" }, { text: "Maintenance", link: "/maintenance" }, { text: "Detail" }]}
          actionText="Back to Maintenance"
          onActionClick={() => navigate("/maintenance")}
        />
        <Box mt={2} px={3}>
          <Alert severity="error">{error || "Maintenance request not found"}</Alert>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate("/maintenance")}>
            Back to Maintenance
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title={`Maintenance #${request.id}`}
        subtitle={request.title || "Request"}
        breadcrumbs={[
          { text: "Dashboard", link: "/" },
          { text: "Maintenance", link: "/maintenance" },
          { text: `#${request.id}` },
        ]}
        actionText="Back"
        onActionClick={() => navigate("/maintenance")}
      />

      <Box px={3} pb={4}>
        {/* Header section (chips and meta) */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <BuildIcon fontSize="large" sx={{ mr: 2, color: "primary.main" }} />
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {request.title}
              </Typography>
              <Box display="flex" alignItems="center" mt={0.5} flexWrap="wrap" gap={1}>
                {statusData && (
                  <Chip size="small" label={statusData.label} color={statusData.color} />
                )}
                {priorityData && (
                  <Chip
                    size="small"
                    label={`Priority: ${priorityData.label}`}
                    color={priorityData.color}
                    variant="outlined"
                  />
                )}
                {request.maintenance_type && (
                  <Chip
                    size="small"
                    icon={getMaintenanceTypeIcon(request.maintenance_type)}
                    label={getMaintenanceTypeLabel(request.maintenance_type)}
                    color="secondary"
                    variant="outlined"
                  />
                )}
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  Created: {fmtDate(request.created_at)}
                </Typography>
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

        {/* Main content */}
        <Grid container spacing={3}>
          {/* Request details */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }} elevation={0}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" whiteSpace="pre-wrap">
                {request.description || "No description provided."}
              </Typography>

              {normalizedImages.length > 0 && (
                <Box mt={3}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Images
                  </Typography>
                  <Grid container spacing={1}>
                    {normalizedImages.map((src, index) => (
                      <Grid item xs={6} sm={4} md={3} key={`${src}-${index}`}>
                        <Box
                          component="img"
                          src={src}
                          alt={`Maintenance image ${index + 1}`}
                          sx={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 1 }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              <Box mt={3}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Updates & Comments
                </Typography>

                {Array.isArray(request.comments) && request.comments.length > 0 ? (
                  request.comments.map((comment, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 2,
                        pb: 2,
                        borderBottom:
                          index !== request.comments.length - 1 ? "1px solid rgba(0,0,0,0.08)" : "none",
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        {comment.user_name || "User"}
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          {fmtDate(comment.created_at)}
                        </Typography>
                      </Typography>
                      <Typography variant="body1" mt={0.5}>
                        {comment.text}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Box textAlign="center" py={3}>
                    <ChatBubbleIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No comments yet
                    </Typography>
                  </Box>
                )}

                <Box component="form" onSubmit={handleCommentSubmit} mt={3}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    variant="outlined"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <IconButton edge="end" color="primary" disabled={!commentText.trim()} type="submit">
                          <SendIcon />
                        </IconButton>
                      ),
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2 }} elevation={0}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Details
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Property
                </Typography>
                <Typography variant="body1">{request.property_name || "N/A"}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Unit
                </Typography>
                <Typography variant="body1">{request.unit_number || "N/A"}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Reported by
                </Typography>
                <Typography variant="body1">{request.reported_by || "N/A"}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Assigned to
                </Typography>
                <Typography variant="body1">{request.assigned_to || "Not assigned"}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Last updated
                </Typography>
                <Typography variant="body1">{fmtDate(request.updated_at)}</Typography>
              </Box>

              {request.status === "completed" && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Completed on
                  </Typography>
                  <Typography variant="body1">{fmtDate(request.completed_at)}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Button
                variant="contained"
                fullWidth
                disabled={request.status === "completed" || submitting}
                onClick={() => quickUpdateStatus("completed")}
              >
                Mark as Complete
              </Button>

              {request.status !== "in_progress" && request.status !== "completed" && (
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 1 }}
                  disabled={submitting}
                  onClick={() => quickUpdateStatus("in_progress")}
                >
                  Start Work
                </Button>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Maintenance Request</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <TextField
              name="title"
              label="Title"
              fullWidth
              margin="normal"
              value={editData.title || ""}
              onChange={handleEditChange}
              error={Boolean(formErrors.title)}
              helperText={formErrors.title}
            />

            <TextField
              name="description"
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={editData.description || ""}
              onChange={handleEditChange}
              error={Boolean(formErrors.description)}
              helperText={formErrors.description}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    name="priority"
                    value={editData.priority || "medium"}
                    label="Priority"
                    onChange={handleEditChange}
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={editData.status || "open"}
                    label="Status"
                    onChange={handleEditChange}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <FormControl fullWidth margin="normal">
              <InputLabel id="maintenance-type-label">Maintenance Type</InputLabel>
              <Select
                labelId="maintenance-type-label"
                name="maintenance_type"
                value={editData.maintenance_type || ""}
                label="Maintenance Type"
                onChange={handleEditChange}
              >
                <MenuItem value="">
                  <em>Select maintenance type</em>
                </MenuItem>
                {MAINTENANCE_CATALOG.map((group) => (
                  <React.Fragment key={group.header}>
                    <ListSubheader
                      disableSticky
                      sx={{
                        bgcolor: group.headerProps?.sx?.bgcolor || "background.paper",
                        color: group.headerProps?.sx?.color || "primary.main",
                        fontWeight: group.headerProps?.sx?.fontWeight || "bold",
                      }}
                    >
                      {group.header}
                    </ListSubheader>
                    {group.items.map(([val, label]) => (
                      <MenuItem key={val} value={val}>
                        {label}
                      </MenuItem>
                    ))}
                  </React.Fragment>
                ))}
              </Select>
            </FormControl>

            {formErrors.submit && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {formErrors.submit}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleUpdateRequest} variant="contained" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this maintenance request? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancel</Button>
          <Button onClick={handleDeleteRequest} color="error" variant="contained" disabled={submitting}>
            {submitting ? "Deleting..." : "Delete Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
