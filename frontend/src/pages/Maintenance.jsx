// frontend/src/pages/Maintenance.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  ListSubheader,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import BuildIcon from "@mui/icons-material/Build";

import {
  Layout,
  PageHeader,
  MaintenanceRequestCard,
  Empty,
  LoadingSpinner,
} from "../components";
import { useMaintenance, useApp, useProperty } from "../context";

const STATUS_TABS = ["all", "open", "in_progress", "completed"];

// Centralized maintenance type catalogue for consistency across UI/back-end
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

export default function Maintenance() {
  const navigate = useNavigate();
  const { maintenanceRequests, loading, error, fetchRequests, createRequest } =
    useMaintenance();
  const { properties } = useProperty();
  const { updatePageTitle } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentStatus, setCurrentStatus] = useState("all");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRequestData, setNewRequestData] = useState({
    title: "",
    description: "",
    property_id: "",
    unit_id: "",
    priority: "medium",
    maintenance_type: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Derived: units for the selected property (if API provides them on the property object)
  const unitsForSelectedProperty = useMemo(() => {
    const p = properties?.find((prop) => String(prop.id) === String(newRequestData.property_id));
    // Support different shapes: prop.units (array) or prop.units_list (array of {id, name})
    if (!p) return [];
    if (Array.isArray(p.units)) return p.units;
    if (Array.isArray(p.units_list)) return p.units_list;
    return [];
  }, [properties, newRequestData.property_id]);

  useEffect(() => {
    updatePageTitle("Maintenance");
    fetchRequests();
  }, [updatePageTitle, fetchRequests]);

  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (maintenanceRequests || []).filter((request) => {
      const statusMatch =
        currentStatus === "all" || request.status === currentStatus;

      const haystack = [
        request.title,
        request.description,
        request.property_name,
        request.priority,
        request.maintenance_type,
      ]
        .map((v) => (v || "").toString().toLowerCase())
        .join(" ");

      const searchMatch = term ? haystack.includes(term) : true;
      return statusMatch && searchMatch;
    });
  }, [maintenanceRequests, currentStatus, searchTerm]);

  const handleStatusChange = (_e, newValue) => {
    setCurrentStatus(newValue);
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };
  const handleFilterClose = () => setFilterAnchorEl(null);

  const handleRequestClick = (id) => {
    navigate(`/maintenance/${id}`);
  };

  const handleRequestMenuClick = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedRequestId(id);
    setMenuAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchorEl(null);

  const openCreateDialog = () => setCreateDialogOpen(true);
  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
    setNewRequestData({
      title: "",
      description: "",
      property_id: "",
      unit_id: "",
      priority: "medium",
      maintenance_type: "",
    });
    setFormErrors({});
  };

  const handleNewRequestChange = (e) => {
    const { name, value } = e.target;
    setNewRequestData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // If property changes, reset unit
    if (name === "property_id") {
      setNewRequestData((prev) => ({ ...prev, unit_id: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!newRequestData.title) errors.title = "Title is required";
    if (!newRequestData.description) errors.description = "Description is required";
    if (!newRequestData.property_id) errors.property_id = "Property is required";
    if (!newRequestData.maintenance_type) errors.maintenance_type = "Maintenance type is required";
    return errors;
  };

  const handleCreateRequest = async () => {
    // Clear any previous form errors
    setFormErrors({});
    
    // Validate all form fields
    const errors = validateForm();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    
    // Use the component's submitting state
    setSubmitting(true);
    
    try {
      // Trim string inputs to prevent whitespace-only submissions
      const sanitizedData = {
        ...newRequestData,
        title: newRequestData.title?.trim(),
        description: newRequestData.description?.trim()
      };
      
      // Call the API to create the request
      await createRequest(sanitizedData);
      
      // Refresh list to ensure the new item appears
      await fetchRequests();
      
      // Close the dialog and reset form on success
      closeCreateDialog();
      
      // Show success message (optional - could be displayed in a snackbar)
      // setSuccessMessage("Maintenance request created successfully");
    } catch (err) {
      // Display the error message in the form with more detail
      console.error("Failed to create maintenance request:", err);
      setFormErrors(prev => ({ 
        ...prev, 
        submit: err?.response?.data?.message || err?.message || "Failed to create request. Please try again." 
      }));
    } finally {
      // Always reset submitting state
      setSubmitting(false);
    }
  };

  const getRequestsCount = (status) => {
    if (status === "all") return (maintenanceRequests || []).length;
    return (maintenanceRequests || []).filter((r) => r.status === status).length;
    // If your API returns aggregated stats, you can swap to those here.
  };

  return (
    <Layout>
      <PageHeader
        title="Maintenance"
        subtitle="Manage maintenance and repair requests"
        breadcrumbs={[
          { text: "Dashboard", link: "/" },
          { text: "Maintenance" },
        ]}
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
            data-testid="header-action"
            id="header-action-button"
            aria-label="New maintenance request"
          >
            New Request
          </Button>
        }
      />

      {/* Status Tabs */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={currentStatus}
          onChange={handleStatusChange}
          aria-label="maintenance request status"
          variant="scrollable"
          scrollButtons="auto"
          TabIndicatorProps={{ sx: { backgroundColor: "primary.main" } }}
          data-testid="status-tabs"
        >
          <Tab label={`All (${getRequestsCount("all")})`} value="all" data-testid="tab-all" />
          <Tab label={`Open (${getRequestsCount("open")})`} value="open" data-testid="tab-open" />
          <Tab label={`In Progress (${getRequestsCount("in_progress")})`} value="in_progress" data-testid="tab-in-progress" />
          <Tab label={`Completed (${getRequestsCount("completed")})`} value="completed" data-testid="tab-completed" />
        </Tabs>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ display: "flex", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search requests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="search-input"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flexGrow: 1,
            minWidth: 200,
            "& .MuiOutlinedInput-root": {
              backgroundColor: "background.paper",
              borderRadius: 2,
            },
          }}
          size="small"
          inputProps={{ "aria-label": "Search maintenance requests" }}
        />

        <Button
          startIcon={<FilterListIcon />}
          onClick={handleFilterClick}
          variant="outlined"
          sx={{ minWidth: 100, borderRadius: 2, py: 0.9 }}
          data-testid="filter-button"
        >
          Filter
        </Button>

        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            elevation: 0,
            sx: {
              boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
              borderRadius: 3,
              mt: 0.5,
            },
          }}
        >
          <MenuItem
            onClick={() => {
              setSearchTerm("");
              handleFilterClose();
            }}
          >
            Clear Filters
          </MenuItem>
          <MenuItem
            onClick={() => {
              setSearchTerm("bathroom");
              handleFilterClose();
            }}
          >
            Bathroom Issues
          </MenuItem>
          <MenuItem
            onClick={() => {
              setSearchTerm("kitchen");
              handleFilterClose();
            }}
          >
            Kitchen Issues
          </MenuItem>
          <MenuItem
            onClick={() => {
              setSearchTerm("electrical");
              handleFilterClose();
            }}
          >
            Electrical Issues
          </MenuItem>
        </Menu>
      </Box>

      {/* Requests Grid */}
      {loading ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <LoadingSpinner />
        </Box>
      ) : error ? (
        <Box sx={{ py: 4 }}>
          <Typography color="error">{String(error)}</Typography>
        </Box>
      ) : filteredRequests.length === 0 ? (
        <Empty
          title={searchTerm ? "No matching requests" : "No maintenance requests"}
          message={
            searchTerm
              ? "Try changing your search criteria"
              : "Create your first maintenance request"
          }
          icon={<BuildIcon sx={{ fontSize: 64 }} />}
          actionText="New Request"
          onActionClick={openCreateDialog}
          actionTestId="empty-action" // Add test ID for empty state action button
        />
      ) : (
        <Grid container spacing={3}>
          {filteredRequests.map((request) => (
            <Grid item xs={12} sm={6} md={4} key={request.id}>
              <MaintenanceRequestCard
                id={request.id}
                title={request.title}
                description={request.description}
                status={request.status}
                priority={request.priority}
                propertyName={request.property_name}
                onClick={() => handleRequestClick(request.id)}
                onContextMenu={(e) => handleRequestMenuClick(e, request.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context menu per request */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        sx={{ mt: 0.5 }}
        PaperProps={{
          elevation: 0,
          sx: { boxShadow: "0px 2px 8px rgba(0,0,0,0.05)", borderRadius: 3 },
        }}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedRequestId != null) handleRequestClick(selectedRequestId);
          }}
        >
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedRequestId != null) navigate(`/maintenance/${selectedRequestId}/edit`);
          }}
        >
          Edit
        </MenuItem>
      </Menu>

      {/* New request dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={closeCreateDialog}
        maxWidth="sm"
        fullWidth
        aria-label="Create maintenance request dialog"
        data-testid="create-dialog"
        PaperProps={{
          elevation: 0,
          sx: { boxShadow: "0px 2px 16px rgba(0,0,0,0.08)", borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Create Maintenance Request</DialogTitle>
        <DialogContent>
          {formErrors.submit && (
            <Typography color="error" sx={{ mb: 2 }} data-testid="submit-error">
              {formErrors.submit}
            </Typography>
          )}

          <TextField
            label="Title"
            name="title"
            value={newRequestData.title}
            onChange={handleNewRequestChange}
            fullWidth
            margin="normal"
            error={Boolean(formErrors.title)}
            helperText={formErrors.title}
            inputProps={{ maxLength: 100 }}
            data-testid="title-input"
            autoFocus
          />

          <TextField
            label="Description"
            name="description"
            value={newRequestData.description}
            onChange={handleNewRequestChange}
            fullWidth
            margin="normal"
            multiline
            rows={4}
            error={Boolean(formErrors.description)}
            helperText={formErrors.description}
            inputProps={{ maxLength: 500 }}
            data-testid="description-input"
          />

          <FormControl fullWidth margin="normal" error={Boolean(formErrors.property_id)}>
            <InputLabel>Property</InputLabel>
            <Select
              name="property_id"
              value={newRequestData.property_id}
              onChange={handleNewRequestChange}
              label="Property"
              data-testid="select-property_id"
              inputProps={{ "data-testid": "property-select-input" }}
            >
              <MenuItem value="">
                <em>Select a property</em>
              </MenuItem>
              {(properties || []).map((property) => (
                <MenuItem key={property.id} value={property.id} data-testid={`property-option-${property.id}`}>
                  {property.name}
                </MenuItem>
              ))}
            </Select>
            {formErrors.property_id && (
              <FormHelperText>{formErrors.property_id}</FormHelperText>
            )}
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Unit (optional)</InputLabel>
            <Select
              name="unit_id"
              value={newRequestData.unit_id}
              onChange={handleNewRequestChange}
              label="Unit (optional)"
              disabled={!newRequestData.property_id || unitsForSelectedProperty.length === 0}
              data-testid="select-unit_id"
              inputProps={{ "data-testid": "unit-select-input" }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {unitsForSelectedProperty.map((u) => {
                // support both shapes: {id, name} or simple value
                const uid = typeof u === "object" ? u.id : u;
                const uname = typeof u === "object" ? (u.name || `Unit ${u.id}`) : String(u);
                return (
                  <MenuItem key={uid} value={uid} data-testid={`unit-option-${uid}`}>
                    {uname}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" error={Boolean(formErrors.maintenance_type)}>
            <InputLabel>Type of Maintenance</InputLabel>
            <Select
              name="maintenance_type"
              value={newRequestData.maintenance_type}
              onChange={handleNewRequestChange}
              label="Type of Maintenance"
              data-testid="select-maintenance_type"
              inputProps={{ "data-testid": "maintenance-type-select-input" }}
            >
              <MenuItem value="">
                <em>Select maintenance type</em>
              </MenuItem>
              {MAINTENANCE_CATALOG.map((group) => (
                <React.Fragment key={group.header}>
                  <ListSubheader
                    disableSticky
                    sx={{
                      bgcolor: (group.headerProps?.sx?.bgcolor) || "background.paper",
                      color: (group.headerProps?.sx?.color) || "primary.main",
                      fontWeight: (group.headerProps?.sx?.fontWeight) || "bold",
                    }}
                  >
                    {group.header}
                  </ListSubheader>
                  {group.items.map(([val, label]) => (
                    <MenuItem key={val} value={val} data-testid={`maintenance-type-option-${val}`}>
                      {label}
                    </MenuItem>
                  ))}
                </React.Fragment>
              ))}
            </Select>
            {formErrors.maintenance_type && (
              <FormHelperText>{formErrors.maintenance_type}</FormHelperText>
            )}
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select
              name="priority"
              value={newRequestData.priority}
              onChange={handleNewRequestChange}
              label="Priority"
              data-testid="select-priority"
              inputProps={{ "data-testid": "priority-select-input" }}
            >
              <MenuItem value="low" data-testid="priority-option-low">Low</MenuItem>
              <MenuItem value="medium" data-testid="priority-option-medium">Medium</MenuItem>
              <MenuItem value="high" data-testid="priority-option-high">High</MenuItem>
            </Select>
          </FormControl>
          
          {/* Display error message when submission fails */}
          {formErrors.submit && (
            <Box sx={{ mt: 2 }}>
              <Typography 
                color="error" 
                variant="body2" 
                role="alert"
              >
                {formErrors.submit}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={closeCreateDialog} 
            sx={{ borderRadius: 2, px: 3 }}
            data-testid="cancel-button"
            id="cancel-dialog-button"
            disabled={submitting}
            aria-label="Cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateRequest}
            variant="contained"
            color="primary"
            sx={{ borderRadius: 2, px: 3 }}
            data-testid="submit-button"
            id="submit-request-button"
            disabled={submitting}
            type="submit"
            aria-label="Create maintenance request"
          >
            {submitting ? "Creating..." : "Create Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
