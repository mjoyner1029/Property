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
  const { maintenanceRequests, stats, loading, error, fetchRequests } =
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
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch requests on component mount
  useEffect(() => {
    updatePageTitle("Maintenance");
    fetchRequests();
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

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      // Submit form data
      // Implement actual API call here using your maintenance context
      // For example: await createMaintenanceRequest(newRequestData);
      console.log("Creating maintenance request:", newRequestData);

      // Close dialog
      handleCreateDialogClose();

      // Refresh data
      fetchRequests();
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
