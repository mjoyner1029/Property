// frontend/src/pages/Maintenance.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
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
import EngineeringIcon from "@mui/icons-material/Engineering";
import {
  Layout,
  PageHeader,
  MaintenanceRequestCard,
  Empty,
  LoadingSpinner,
  Card,
} from "../components";
import { useMaintenance, useApp, useProperty } from "../context";

export default function Maintenance() {
  const navigate = useNavigate();
  const { maintenanceRequests, stats, loading, error, fetchRequests, createRequest } =
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

  // Fetch requests on component mount
  useEffect(() => {
    updatePageTitle("Maintenance");
    
    // Force a fetch regardless of state to ensure we have latest data
    fetchRequests();
    
    console.log('Maintenance component mounted - current state:', {
      requestCount: maintenanceRequests.length,
      isLoading: loading,
      hasError: error
    });
    
    // Log axios headers to debug authentication issues
    const token = localStorage.getItem('token');
    console.log('Current auth token available:', !!token);
    if (token) {
      console.log('Token first 20 chars:', token.substring(0, 20));
    }
  }, [updatePageTitle, fetchRequests]);

  // Filter requests
  const filteredRequests = maintenanceRequests.filter((request) => {
    // Status filter
    const statusMatch =
      currentStatus === "all" || request.status === currentStatus;

    // Search filter
    const searchMatch =
      request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.property_name?.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  // Handle status tab change
  const handleStatusChange = (event, newValue) => {
    setCurrentStatus(newValue);
  };

  // Menu handlers
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // Handle request click
  const handleRequestClick = (id) => {
    navigate(`/maintenance/${id}`);
  };

  // Handle request menu
  const handleRequestMenuClick = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedRequestId(id);
    setMenuAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // New request dialog
  const handleCreateDialogOpen = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
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

  // Form change handlers
  const handleNewRequestChange = (e) => {
    const { name, value } = e.target;
    setNewRequestData((prev) => ({ ...prev, [name]: value }));

    // Clear validation error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Form submission
  const handleCreateRequest = async () => {
    // Validate form
    const errors = {};
    if (!newRequestData.title) errors.title = "Title is required";
    if (!newRequestData.description) errors.description = "Description is required";
    if (!newRequestData.property_id) errors.property_id = "Property is required";
    if (!newRequestData.maintenance_type) errors.maintenance_type = "Maintenance type is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      // Submit form data using context method
      await createRequest(newRequestData);

      // Close dialog
      handleCreateDialogClose();

      // Success notification can be added here

    } catch (error) {
      console.error("Error creating request:", error);
      // Show error to user
      setFormErrors({ submit: error.message || "Failed to create request" });
    }
  };

  // Render count by status
  const getRequestsCount = (status) => {
    if (status === "all") return maintenanceRequests.length;
    return maintenanceRequests.filter((req) => req.status === status).length;
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
        actionText="New Request"
        actionIcon={<AddIcon />}
        onActionClick={handleCreateDialogOpen}
      />

      {/* Status Tabs */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={currentStatus}
          onChange={handleStatusChange}
          aria-label="maintenance request status"
          variant="scrollable"
          scrollButtons="auto"
          TabIndicatorProps={{
            sx: { backgroundColor: 'primary.main' }
          }}
        >
          <Tab label={`All (${getRequestsCount("all")})`} value="all" />
          <Tab label={`Open (${getRequestsCount("open")})`} value="open" />
          <Tab
            label={`In Progress (${getRequestsCount("in_progress")})`}
            value="in_progress"
          />
          <Tab
            label={`Completed (${getRequestsCount("completed")})`}
            value="completed"
          />
        </Tabs>
      </Box>

      {/* Search and filters */}
      <Box sx={{ display: "flex", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search requests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
        />

        <Button
          startIcon={<FilterListIcon />}
          onClick={handleFilterClick}
          variant="outlined"
          sx={{ 
            minWidth: 100,
            borderRadius: 2,
            py: 0.9
          }}
        >
          Filter
        </Button>

        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            elevation: 0,
            sx: {
              boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
              borderRadius: 3,
              mt: 0.5
            }
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

      {/* Maintenance Requests Grid */}
      {loading ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <LoadingSpinner />
        </Box>
      ) : error ? (
        <Box sx={{ py: 4 }}>
          <Typography color="error">{error}</Typography>
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
          onActionClick={handleCreateDialogOpen}
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

      {/* Request menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        sx={{ mt: 0.5 }}
        PaperProps={{
          elevation: 0,
          sx: {
            boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            borderRadius: 3
          }
        }}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleRequestClick(selectedRequestId);
          }}
        >
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>Edit</MenuItem>
        <MenuItem onClick={handleMenuClose}>Delete</MenuItem>
      </Menu>

      {/* New request dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCreateDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: {
            boxShadow: '0px 2px 16px rgba(0,0,0,0.08)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Create Maintenance Request</DialogTitle>
        <DialogContent>
          {formErrors.submit && (
            <Typography color="error" sx={{ mb: 2 }}>
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
          />

          <FormControl 
            fullWidth 
            margin="normal" 
            error={Boolean(formErrors.property_id)}
          >
            <InputLabel>Property</InputLabel>
            <Select
              name="property_id"
              value={newRequestData.property_id}
              onChange={handleNewRequestChange}
              label="Property"
            >
              <MenuItem value="">
                <em>Select a property</em>
              </MenuItem>
              {properties.map((property) => (
                <MenuItem key={property.id} value={property.id}>
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
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {/* Map units here if available */}
            </Select>
          </FormControl>

          <FormControl 
            fullWidth 
            margin="normal"
            error={Boolean(formErrors.maintenance_type)}
          >
            <InputLabel>Type of Maintenance</InputLabel>
            <Select
              name="maintenance_type"
              value={newRequestData.maintenance_type}
              onChange={handleNewRequestChange}
              label="Type of Maintenance"
            >
              <MenuItem value="">
                <em>Select maintenance type</em>
              </MenuItem>
              
              {/* Plumbing Category */}
              <ListSubheader sx={{ bgcolor: 'background.paper', fontWeight: 'bold', color: 'primary.main' }}>
                Plumbing
              </ListSubheader>
              <MenuItem value="plumbing_leaking">Leaking faucet or pipe</MenuItem>
              <MenuItem value="plumbing_clogged">Clogged toilet or drain</MenuItem>
              <MenuItem value="plumbing_no_hot_water">No hot water</MenuItem>
              <MenuItem value="plumbing_running_toilet">Running toilet</MenuItem>
              <MenuItem value="plumbing_low_pressure">Low water pressure</MenuItem>
              <MenuItem value="plumbing_disposal">Broken garbage disposal</MenuItem>
              <MenuItem value="plumbing_water_heater">Water heater issue</MenuItem>
              
              {/* Electrical Category */}
              <ListSubheader sx={{ bgcolor: 'background.paper', fontWeight: 'bold', color: 'primary.main' }}>
                Electrical
              </ListSubheader>
              <MenuItem value="electrical_no_power">No power in outlet or room</MenuItem>
              <MenuItem value="electrical_light_fixture">Light fixture not working</MenuItem>
              <MenuItem value="electrical_circuit_breaker">Circuit breaker tripping</MenuItem>
              <MenuItem value="electrical_fan">Broken ceiling fan</MenuItem>
              <MenuItem value="electrical_power_surge">Power surge or flickering lights</MenuItem>
              <MenuItem value="electrical_smoke_detector">Smoke detector not working</MenuItem>
              
              {/* HVAC Category */}
              <ListSubheader sx={{ bgcolor: 'background.paper', fontWeight: 'bold', color: 'primary.main' }}>
                HVAC
              </ListSubheader>
              <MenuItem value="hvac_no_heat">No heat</MenuItem>
              <MenuItem value="hvac_no_ac">No A/C</MenuItem>
              <MenuItem value="hvac_noise">Strange HVAC noise</MenuItem>
              <MenuItem value="hvac_thermostat">Thermostat not working</MenuItem>
              <MenuItem value="hvac_filter">Air filter replacement</MenuItem>
              
              {/* Doors, Windows & Locks */}
              <ListSubheader sx={{ bgcolor: 'background.paper', fontWeight: 'bold', color: 'primary.main' }}>
                Doors, Windows & Locks
              </ListSubheader>
              <MenuItem value="door_broken">Broken or stuck door</MenuItem>
              <MenuItem value="lock_not_working">Lock not working</MenuItem>
              <MenuItem value="lock_lost_key">Lost key or lockout</MenuItem>
              <MenuItem value="window_stuck">Window won't open/close</MenuItem>
              <MenuItem value="window_broken">Broken screen or cracked window</MenuItem>
              
              {/* Interior & Structural */}
              <ListSubheader sx={{ bgcolor: 'background.paper', fontWeight: 'bold', color: 'primary.main' }}>
                Interior & Structural
              </ListSubheader>
              <MenuItem value="interior_wall_ceiling">Wall or ceiling damage</MenuItem>
              <MenuItem value="interior_floor">Floor damage</MenuItem>
              <MenuItem value="interior_cabinet">Cabinet/drawer broken</MenuItem>
              <MenuItem value="interior_paint">Paint peeling</MenuItem>
              <MenuItem value="interior_mold">Mold or mildew</MenuItem>
              
              {/* Appliances */}
              <ListSubheader sx={{ bgcolor: 'background.paper', fontWeight: 'bold', color: 'primary.main' }}>
                Appliances
              </ListSubheader>
              <MenuItem value="appliance_refrigerator">Refrigerator not cooling</MenuItem>
              <MenuItem value="appliance_stove">Stove/oven not working</MenuItem>
              <MenuItem value="appliance_washer_dryer">Washer/dryer issue</MenuItem>
              <MenuItem value="appliance_dishwasher">Dishwasher not draining</MenuItem>
              <MenuItem value="appliance_microwave">Microwave issue</MenuItem>
              
              {/* Pest & Infestation */}
              <ListSubheader sx={{ bgcolor: 'background.paper', fontWeight: 'bold', color: 'primary.main' }}>
                Pest & Infestation
              </ListSubheader>
              <MenuItem value="pest_insects_rodents">Roaches, ants, or rodents</MenuItem>
              <MenuItem value="pest_termite">Termite concern</MenuItem>
              <MenuItem value="pest_bees">Bees/wasps</MenuItem>
              <MenuItem value="pest_bedbugs">Bed bugs</MenuItem>
              <MenuItem value="pest_fleas">Fleas</MenuItem>
              
              {/* Exterior */}
              <ListSubheader sx={{ bgcolor: 'background.paper', fontWeight: 'bold', color: 'primary.main' }}>
                Exterior
              </ListSubheader>
              <MenuItem value="exterior_roof">Roof leak</MenuItem>
              <MenuItem value="exterior_gutter">Broken gutter</MenuItem>
              <MenuItem value="exterior_yard">Yard maintenance</MenuItem>
              <MenuItem value="exterior_lighting">Exterior lighting issue</MenuItem>
              <MenuItem value="exterior_flooding">Flooding</MenuItem>
              
              {/* Emergency / Safety */}
              <ListSubheader sx={{ bgcolor: 'background.paper', fontWeight: 'bold', color: 'primary.main', bgcolor: 'error.light' }}>
                Emergency / Safety
              </ListSubheader>
              <MenuItem value="emergency_gas">Gas leak</MenuItem>
              <MenuItem value="emergency_fire_alarm">Fire alarm issue</MenuItem>
              <MenuItem value="emergency_carbon_monoxide">Carbon monoxide detector issue</MenuItem>
              <MenuItem value="emergency_lockout">Lockout</MenuItem>
              <MenuItem value="emergency_security">Broken security feature</MenuItem>
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
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCreateDialogClose} 
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateRequest}
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Create Request
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
