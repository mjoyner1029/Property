import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Typography,
  MenuItem,
  IconButton,
  Menu,
  Chip,
  Card,
  CardContent,
  CardActions,
  Avatar,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import HomeIcon from "@mui/icons-material/Home";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import { PageHeader, LoadingSpinner } from "../../components";
import api from "../../utils/api";
import { useApp } from "../../context";

export default function AdminProperties() {
  const navigate = useNavigate();
  const { updatePageTitle } = useApp();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [propertyDetailOpen, setPropertyDetailOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    updatePageTitle("All Properties - Admin");
    fetchProperties();
  }, [updatePageTitle, page, rowsPerPage, statusFilter, searchTerm]);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        per_page: rowsPerPage.toString(),
      });
      
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      
      const response = await api.get(`/admin/properties?${params.toString()}`);
      
      setProperties(response.data.properties || []);
      setTotalCount(response.data.total || 0);
    } catch (err) {
      console.error('Error fetching admin properties:', err);
      setError(err.response?.data?.error || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(0); // Reset to first page when filtering
    setFilterAnchorEl(null);
  };

  const handlePropertyDetail = (property) => {
    setSelectedProperty(property);
    setPropertyDetailOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredAndSortedProperties = properties.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "landlord":
        return a.landlord_name.localeCompare(b.landlord_name);
      case "units":
        return b.unit_count - a.unit_count;
      case "tenants":
        return b.tenant_count - a.tenant_count;
      case "created":
        return new Date(b.created_at) - new Date(a.created_at);
      default:
        return 0;
    }
  });

  if (loading && properties.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <PageHeader
        title="All Properties"
        subtitle="System-wide property management"
        icon={<BusinessIcon />}
      />

      {/* Search and Filter Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search properties..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={(e) => setFilterAnchorEl(e.currentTarget)}
        >
          Status: {statusFilter === 'all' ? 'All' : statusFilter}
        </Button>
        
        <TextField
          select
          label="Sort by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="landlord">Landlord</MenuItem>
          <MenuItem value="units">Unit Count</MenuItem>
          <MenuItem value="tenants">Tenant Count</MenuItem>
          <MenuItem value="created">Created Date</MenuItem>
        </TextField>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem onClick={() => handleStatusFilterChange("all")}>All Statuses</MenuItem>
        <MenuItem onClick={() => handleStatusFilterChange("active")}>Active</MenuItem>
        <MenuItem onClick={() => handleStatusFilterChange("inactive")}>Inactive</MenuItem>
        <MenuItem onClick={() => handleStatusFilterChange("pending")}>Pending</MenuItem>
      </Menu>

      {/* Error Display */}
      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {/* Properties Grid */}
      <Grid container spacing={3}>
        {filteredAndSortedProperties.map((property) => (
          <Grid item xs={12} md={6} lg={4} key={property.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4,
                }
              }}
              onClick={() => handlePropertyDetail(property)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <HomeIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="div" noWrap>
                        {property.name}
                      </Typography>
                      <Chip 
                        label={property.status} 
                        color={getStatusColor(property.status)}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {property.address}, {property.city}, {property.state} {property.zip_code}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Landlord:</strong> {property.landlord_name}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {property.unit_count} units
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {property.tenant_count} tenants
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Created: {new Date(property.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* No Properties Message */}
      {!loading && properties.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No properties found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || statusFilter !== 'all' ? 
              'Try adjusting your search or filter criteria.' : 
              'No properties have been added to the system yet.'
            }
          </Typography>
        </Box>
      )}

      {/* Pagination */}
      {totalCount > 0 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Box>
      )}

      {/* Property Detail Dialog */}
      <Dialog
        open={propertyDetailOpen}
        onClose={() => setPropertyDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Property Details: {selectedProperty?.name}
        </DialogTitle>
        <DialogContent>
          {selectedProperty && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedProperty.address}<br />
                    {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Property Type</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedProperty.property_type}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Landlord</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedProperty.landlord_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={selectedProperty.status} 
                    color={getStatusColor(selectedProperty.status)}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Units</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedProperty.unit_count}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Active Tenants</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedProperty.tenant_count}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">
                    {new Date(selectedProperty.created_at).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPropertyDetailOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setPropertyDetailOpen(false);
              navigate(`/properties/${selectedProperty.id}`);
            }}
          >
            View Full Details
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading overlay for pagination */}
      {loading && properties.length > 0 && (
        <Box sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          bgcolor: 'rgba(255, 255, 255, 0.7)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <LoadingSpinner />
        </Box>
      )}
    </Box>
  );
}
