// frontend/src/pages/MaintenanceDetail.jsx
import React, { useEffect, useState } from "react";
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
  Image as ImageIcon,
  Send as SendIcon,
  Plumbing as PlumbingIcon,
  ElectricalServices as ElectricalServicesIcon,
  Hvac as HvacIcon,
  DoorFront as DoorFrontIcon,
  Chair as ChairIcon,
  Kitchen as KitchenIcon,
  PestControl as PestControlIcon,
  Home as HomeIcon,
  Warning as WarningIcon,
  HomeRepairService as HomeRepairServiceIcon
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useMaintenance, useApp } from "../context";

export default function MaintenanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { maintenanceRequests, updateRequest, deleteRequest, fetchRequests } = useMaintenance();
  const { updatePageTitle } = useApp();
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editData, setEditData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Status options
  const statusOptions = [
    { value: 'open', label: 'Open', color: 'warning' },
    { value: 'in_progress', label: 'In Progress', color: 'info' },
    { value: 'completed', label: 'Completed', color: 'success' },
    { value: 'cancelled', label: 'Cancelled', color: 'error' }
  ];
  
  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'success' },
    { value: 'medium', label: 'Medium', color: 'info' },
    { value: 'high', label: 'High', color: 'warning' },
    { value: 'emergency', label: 'Emergency', color: 'error' }
  ];
  
  // Get maintenance type icon
  const getMaintenanceTypeIcon = (type) => {
    if (!type) return <HomeRepairServiceIcon />;
    
    if (type.startsWith('plumbing')) {
      return <PlumbingIcon />;
    } else if (type.startsWith('electrical')) {
      return <ElectricalServicesIcon />;
    } else if (type.startsWith('hvac')) {
      return <HvacIcon />;
    } else if (type.startsWith('door') || type.startsWith('window') || type.startsWith('lock')) {
      return <DoorFrontIcon />;
    } else if (type.startsWith('interior')) {
      return <ChairIcon />;
    } else if (type.startsWith('appliance')) {
      return <KitchenIcon />;
    } else if (type.startsWith('pest')) {
      return <PestControlIcon />;
    } else if (type.startsWith('exterior')) {
      return <HomeIcon />;
    } else if (type.startsWith('emergency')) {
      return <WarningIcon />;
    }
    
    return <HomeRepairServiceIcon />;
  };
  
  // Get maintenance type label
  const getMaintenanceTypeLabel = (type) => {
    if (!type) return 'Other';
    
    // Format the type for display
    const formatType = (type) => {
      const parts = type.split('_');
      if (parts.length <= 1) return type;
      
      const category = parts[0];
      const rest = parts.slice(1).join('_').replace(/_/g, ' ');
      
      // Format the category
      const formatCategory = (cat) => {
        return cat.charAt(0).toUpperCase() + cat.slice(1);
      };
      
      return `${formatCategory(category)}: ${rest}`;
    };
    
    return formatType(type);
  };
  
  // Find the request in context or fetch it
  useEffect(() => {
    const loadRequest = async () => {
      try {
        setLoading(true);
        // Check if we have the request in context first
        let foundRequest = maintenanceRequests.find(r => r.id.toString() === id.toString());
        
        if (!foundRequest) {
          // If not in context, fetch all requests to update context
          await fetchRequests();
          foundRequest = maintenanceRequests.find(r => r.id.toString() === id.toString());
        }
        
        if (foundRequest) {
          setRequest(foundRequest);
          updatePageTitle(`Maintenance #${foundRequest.id}`);
          
          // Initialize edit form data
          setEditData({
            title: foundRequest.title,
            description: foundRequest.description,
            priority: foundRequest.priority,
            status: foundRequest.status,
            maintenance_type: foundRequest.maintenance_type || ""
          });
        } else {
          setError('Maintenance request not found');
        }
      } catch (err) {
        console.error('Error loading request:', err);
        setError('Failed to load maintenance request details');
      } finally {
        setLoading(false);
      }
    };
    
    loadRequest();
  }, [id, maintenanceRequests, fetchRequests, updatePageTitle]);
  
  // Handle comment submission
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    // Here you'd call an API to add the comment
    console.log('Submitting comment:', commentText);
    setCommentText('');
  };
  
  // Handle edit dialog
  const handleEditOpen = () => {
    setEditDialogOpen(true);
    setFormErrors({});
  };
  
  const handleEditClose = () => {
    setEditDialogOpen(false);
  };
  
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field changes
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleUpdateRequest = async () => {
    // Validation
    const errors = {};
    if (!editData.title) errors.title = "Title is required";
    if (!editData.description) errors.description = "Description is required";
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setSubmitting(true);
    try {
      const updated = await updateRequest(id, editData);
      setRequest(updated);
      handleEditClose();
    } catch (err) {
      setFormErrors({ submit: err.message || "Failed to update request" });
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
  
  const handleDeleteRequest = async () => {
    setSubmitting(true);
    try {
      await deleteRequest(id);
      navigate('/maintenance');
    } catch (err) {
      setError("Failed to delete maintenance request");
    } finally {
      setSubmitting(false);
      handleDeleteClose();
    }
  };
  
  // Get status and priority display data
  const getStatusData = (statusValue) => {
    return statusOptions.find(option => option.value === statusValue) || 
      { value: statusValue, label: statusValue, color: 'default' };
  };
  
  const getPriorityData = (priorityValue) => {
    return priorityOptions.find(option => option.value === priorityValue) || 
      { value: priorityValue, label: priorityValue, color: 'default' };
  };
  
  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
      </Box>
    );
  }
  
  // Error state
  if (error || !request) {
    return (
      <Box mt={4} px={3}>
        <Alert severity="error">{error || "Maintenance request not found"}</Alert>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate("/maintenance")}>
          Back to Maintenance
        </Button>
      </Box>
    );
  }
  
  const statusData = getStatusData(request.status);
  const priorityData = getPriorityData(request.priority);
  
  return (
    <Box p={3}>
      {/* Header section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <BuildIcon fontSize="large" sx={{ mr: 2, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {request.title}
            </Typography>
            <Box display="flex" alignItems="center" mt={0.5}>
              <Chip 
                size="small" 
                label={statusData.label} 
                color={statusData.color} 
                sx={{ mr: 1 }}
              />
              <Chip 
                size="small" 
                label={`Priority: ${priorityData.label}`} 
                color={priorityData.color} 
                variant="outlined"
                sx={{ mr: 1 }}
              />
              {request.maintenance_type && (
                <Chip
                  size="small"
                  icon={getMaintenanceTypeIcon(request.maintenance_type)}
                  label={getMaintenanceTypeLabel(request.maintenance_type)}
                  color="secondary"
                  variant="outlined"
                />
              )}
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Created: {new Date(request.created_at).toLocaleDateString()}
              </Typography>
            </Box>
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
      
      {/* Main content */}
      <Grid container spacing={3}>
        {/* Request details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }} elevation={0}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" whiteSpace="pre-wrap">
              {request.description}
            </Typography>
            
            {request.images && request.images.length > 0 && (
              <Box mt={3}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Images
                </Typography>
                <Grid container spacing={1}>
                  {request.images.map((image, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Box
                        component="img"
                        src={image.url}
                        alt={`Maintenance image ${index + 1}`}
                        sx={{
                          width: '100%',
                          height: 120,
                          objectFit: 'cover',
                          borderRadius: 1
                        }}
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
              
              {request.comments && request.comments.length > 0 ? (
                request.comments.map((comment, index) => (
                  <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index !== request.comments.length - 1 ? '1px solid #eee' : 'none' }}>
                    <Typography variant="body2" fontWeight={500}>
                      {comment.user_name}
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {new Date(comment.created_at).toLocaleString()}
                      </Typography>
                    </Typography>
                    <Typography variant="body1" mt={0.5}>
                      {comment.text}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Box textAlign="center" py={3}>
                  <ChatBubbleIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
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
                      <IconButton 
                        edge="end" 
                        color="primary"
                        disabled={!commentText.trim()}
                        type="submit"
                      >
                        <SendIcon />
                      </IconButton>
                    )
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
              <Typography variant="body1">
                {request.property_name || 'N/A'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Unit
              </Typography>
              <Typography variant="body1">
                {request.unit_number || 'N/A'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Reported by
              </Typography>
              <Typography variant="body1">
                {request.reported_by || 'N/A'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Assigned to
              </Typography>
              <Typography variant="body1">
                {request.assigned_to || 'Not assigned'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Last updated
              </Typography>
              <Typography variant="body1">
                {request.updated_at ? new Date(request.updated_at).toLocaleString() : 'N/A'}
              </Typography>
            </Box>
            
            {request.status === 'completed' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Completed on
                </Typography>
                <Typography variant="body1">
                  {request.completed_at ? new Date(request.completed_at).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Button 
              variant="contained"
              fullWidth
              disabled={request.status === 'completed'}
              onClick={() => {
                setEditData(prev => ({ ...prev, status: 'completed' }));
                handleUpdateRequest();
              }}
            >
              Mark as Complete
            </Button>
            
            {request.status !== 'in_progress' && request.status !== 'completed' && (
              <Button 
                variant="outlined"
                fullWidth
                sx={{ mt: 1 }}
                onClick={() => {
                  setEditData(prev => ({ ...prev, status: 'in_progress' }));
                  handleUpdateRequest();
                }}
              >
                Start Work
              </Button>
            )}
          </Paper>
        </Grid>
      </Grid>
      
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
              value={editData.title || ''}
              onChange={handleEditChange}
              error={!!formErrors.title}
              helperText={formErrors.title}
            />
            
            <TextField
              name="description"
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={editData.description || ''}
              onChange={handleEditChange}
              error={!!formErrors.description}
              helperText={formErrors.description}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    name="priority"
                    value={editData.priority || 'medium'}
                    label="Priority"
                    onChange={handleEditChange}
                  >
                    {priorityOptions.map(option => (
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
                    value={editData.status || 'open'}
                    label="Status"
                    onChange={handleEditChange}
                  >
                    {statusOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            {/* Maintenance Type Dropdown */}
            <FormControl fullWidth margin="normal">
              <InputLabel id="maintenance-type-label">Maintenance Type</InputLabel>
              <Select
                labelId="maintenance-type-label"
                name="maintenance_type"
                value={editData.maintenance_type || ''}
                label="Maintenance Type"
                onChange={handleEditChange}
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
          <Button 
            onClick={handleUpdateRequest} 
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
            Are you sure you want to delete this maintenance request? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancel</Button>
          <Button 
            onClick={handleDeleteRequest} 
            color="error" 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Deleting...' : 'Delete Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
