import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Typography,
  MenuItem,
  Card,
  CardContent,
  Avatar,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import HomeIcon from "@mui/icons-material/Home";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { PageHeader, LoadingSpinner } from "../../components";
import api from "../../utils/api";
import { useApp } from "../../context";

export default function AdminTenants() {
  const navigate = useNavigate();
  const { updatePageTitle } = useApp();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [tenantDetailOpen, setTenantDetailOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
    updatePageTitle("All Tenants - Admin");
    fetchTenants();
  }, [updatePageTitle, page, rowsPerPage, searchTerm]);

  const fetchTenants = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        per_page: rowsPerPage.toString(),
      });
      
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      
      const response = await api.get(`/admin/tenants?${params.toString()}`);
      
      setTenants(response.data.tenants || []);
      setTotalCount(response.data.total || 0);
    } catch (err) {
      console.error('Error fetching admin tenants:', err);
      setError(err.response?.data?.error || 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleTenantDetail = (tenant) => {
    setSelectedTenant(tenant);
    setTenantDetailOpen(true);
  };

  const getVerificationColor = (isVerified) => {
    return isVerified ? 'success' : 'warning';
  };

  const filteredAndSortedTenants = tenants.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "email":
        return a.email.localeCompare(b.email);
      case "properties":
        return b.property_count - a.property_count;
      case "created":
        return new Date(b.created_at) - new Date(a.created_at);
      default:
        return 0;
    }
  });

  if (loading && tenants.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <PageHeader
        title="All Tenants"
        subtitle="System-wide tenant management"
        icon={<PeopleIcon />}
      />

      {/* Search and Sort Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search tenants..."
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
        
        <TextField
          select
          label="Sort by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="email">Email</MenuItem>
          <MenuItem value="properties">Property Count</MenuItem>
          <MenuItem value="created">Created Date</MenuItem>
        </TextField>
      </Box>

      {/* Error Display */}
      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {/* Tenants Grid */}
      <Grid container spacing={3}>
        {filteredAndSortedTenants.map((tenant) => (
          <Grid item xs={12} md={6} lg={4} key={tenant.id}>
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
              onClick={() => handleTenantDetail(tenant)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="div" noWrap>
                        {tenant.name}
                      </Typography>
                      <Chip 
                        label={tenant.is_verified ? 'Verified' : 'Unverified'} 
                        color={getVerificationColor(tenant.is_verified)}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {tenant.email}
                  </Typography>
                </Box>

                {tenant.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {tenant.phone}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <HomeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {tenant.property_count} {tenant.property_count === 1 ? 'property' : 'properties'}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Joined: {new Date(tenant.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* No Tenants Message */}
      {!loading && tenants.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tenants found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 
              'Try adjusting your search criteria.' : 
              'No tenants have been registered in the system yet.'
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

      {/* Tenant Detail Dialog */}
      <Dialog
        open={tenantDetailOpen}
        onClose={() => setTenantDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Tenant Details: {selectedTenant?.name}
        </DialogTitle>
        <DialogContent>
          {selectedTenant && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Contact Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><EmailIcon /></ListItemIcon>
                      <ListItemText primary={selectedTenant.email} secondary="Email" />
                    </ListItem>
                    {selectedTenant.phone && (
                      <ListItem>
                        <ListItemIcon><PhoneIcon /></ListItemIcon>
                        <ListItemText primary={selectedTenant.phone} secondary="Phone" />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemText 
                        primary={selectedTenant.is_verified ? 'Verified' : 'Unverified'} 
                        secondary="Account Status"
                        primaryTypographyProps={{
                          color: selectedTenant.is_verified ? 'success.main' : 'warning.main'
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary={new Date(selectedTenant.created_at).toLocaleDateString()}
                        secondary="Join Date" 
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Active Properties ({selectedTenant.active_properties?.length || 0})
                  </Typography>
                  {selectedTenant.active_properties && selectedTenant.active_properties.length > 0 ? (
                    <List dense>
                      {selectedTenant.active_properties.map((property, index) => (
                        <React.Fragment key={property.id}>
                          <ListItem>
                            <ListItemIcon><HomeIcon /></ListItemIcon>
                            <ListItemText
                              primary={property.name}
                              secondary={
                                <Box>
                                  <Typography variant="caption" display="block">
                                    {property.address}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Landlord: {property.landlord_name}
                                  </Typography>
                                  {property.rent_amount && (
                                    <Typography variant="caption" display="block">
                                      Rent: ${property.rent_amount}/month
                                    </Typography>
                                  )}
                                  {property.lease_start && property.lease_end && (
                                    <Typography variant="caption" display="block">
                                      Lease: {new Date(property.lease_start).toLocaleDateString()} - {new Date(property.lease_end).toLocaleDateString()}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < selectedTenant.active_properties.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No active properties
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTenantDetailOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setTenantDetailOpen(false);
              navigate(`/tenants/${selectedTenant.id}`);
            }}
          >
            View Full Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading overlay for pagination */}
      {loading && tenants.length > 0 && (
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
