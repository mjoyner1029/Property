import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  AttachMoney as MoneyIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useProperty } from '../context/PropertyContext';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/PageHeader';

function StatusBadge({ status }) {
  const theme = useTheme();
  
  const getStatusColor = () => {
    switch(status.toLowerCase()) {
      case 'occupied':
      case 'paid':
      case 'completed':
        return theme.palette.success.main;
      case 'vacant':
      case 'due':
        return theme.palette.info.main;
      case 'maintenance':
      case 'in_progress':
      case 'pending':
        return theme.palette.warning.main;
      case 'overdue':
      case 'urgent':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };
  
  const getStatusLabel = () => {
    switch(status.toLowerCase()) {
      case 'in_progress':
        return 'In Progress';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  return (
    <Chip 
      label={getStatusLabel()}
      size="small"
      sx={{
        backgroundColor: getStatusColor() + '20',
        color: getStatusColor(),
        fontWeight: 500,
        borderRadius: 1
      }}
    />
  );
}

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedProperty, loading, error, fetchPropertyById } = useProperty();
  const { updatePageTitle } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  useEffect(() => {
    fetchPropertyById(id);
  }, [id, fetchPropertyById]);

  useEffect(() => {
    if (selectedProperty) {
      updatePageTitle(selectedProperty.name);
    }
  }, [selectedProperty, updatePageTitle]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEditProperty = () => {
    handleMenuClose();
    navigate(`/properties/${id}/edit`);
  };

  const handleDeleteDialogOpen = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteProperty = async () => {
    // Implementation of delete functionality
    handleDeleteDialogClose();
    navigate('/properties');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!selectedProperty) {
    return (
      <Box p={3}>
        <Alert severity="warning">Property not found</Alert>
      </Box>
    );
  }

  // Sample units data - replace with actual units from API
  const units = selectedProperty.units || [
    { id: 1, unit_number: '101', rent: 1500, status: 'occupied', tenant_id: 1, tenant_name: 'John Smith' },
    { id: 2, unit_number: '102', rent: 1400, status: 'vacant' },
    { id: 3, unit_number: '201', rent: 1600, status: 'occupied', tenant_id: 2, tenant_name: 'Sarah Johnson' },
    { id: 4, unit_number: '202', rent: 1550, status: 'maintenance' }
  ];

  // Sample tenants data
  const tenants = units
    .filter(unit => unit.tenant_id)
    .map(unit => ({
      id: unit.tenant_id,
      name: unit.tenant_name || 'Unknown Tenant',
      unit: unit.unit_number,
      email: `tenant${unit.tenant_id}@example.com`,
      phone: '(555) 123-4567',
      moveInDate: '2025-01-15'
    }));

  // Sample maintenance data
  const maintenanceRequests = [
    { id: 1, title: 'Leaking faucet', unit: '101', status: 'pending', created_at: '2025-06-15T10:30:00Z' },
    { id: 2, title: 'Broken window', unit: '202', status: 'in_progress', created_at: '2025-06-12T14:20:00Z' },
    { id: 3, title: 'HVAC not working', unit: '201', status: 'completed', created_at: '2025-06-10T09:15:00Z' }
  ];
  
  // Sample financial data
  const financials = {
    monthlyIncome: units.reduce((sum, unit) => sum + unit.rent, 0),
    occupancyRate: Math.round((units.filter(unit => unit.status === 'occupied').length / units.length) * 100),
    outstandingPayments: 1200,
    expenses: 850
  };
  
  // Property Summary Card
  const PropertySummary = () => (
    <Card 
      elevation={0}
      sx={{ 
        boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
        borderRadius: 3
      }}
    >
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="overline" color="text.secondary">Address</Typography>
              <Typography variant="body1">{selectedProperty.address}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="overline" color="text.secondary">Property Type</Typography>
              <Typography variant="body1">{selectedProperty.type || 'Apartment Building'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedProperty.year_built ? `Built in ${selectedProperty.year_built}` : ''}
                {selectedProperty.square_feet ? ` • ${selectedProperty.square_feet} sq ft` : ''}
              </Typography>
            </Box>
          </Grid>
          {selectedProperty.description && (
            <Grid item xs={12}>
              <Typography variant="overline" color="text.secondary">Description</Typography>
              <Typography variant="body2">{selectedProperty.description}</Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
  
  // Units Table
  const UnitsTable = () => (
    <TableContainer 
      component={Paper}
      elevation={0}
      sx={{ 
        boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
        borderRadius: 3,
        overflow: 'hidden'
      }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'background.paperAlt' }}>
            <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Rent</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {units.map((unit) => (
            <TableRow key={unit.id} hover>
              <TableCell>{unit.unit_number}</TableCell>
              <TableCell>${unit.rent}</TableCell>
              <TableCell>
                <StatusBadge status={unit.status} />
              </TableCell>
              <TableCell>{unit.tenant_name || 'Vacant'}</TableCell>
              <TableCell align="right">
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
  
  // Tenants Table
  const TenantsTable = () => (
    <TableContainer 
      component={Paper}
      elevation={0}
      sx={{ 
        boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
        borderRadius: 3,
        overflow: 'hidden'
      }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'background.paperAlt' }}>
            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Move-in Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id} hover>
              <TableCell>{tenant.name}</TableCell>
              <TableCell>{tenant.unit}</TableCell>
              <TableCell>{tenant.email}</TableCell>
              <TableCell>{tenant.phone}</TableCell>
              <TableCell>{tenant.moveInDate}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
  
  // Maintenance Table
  const MaintenanceTable = () => (
    <TableContainer 
      component={Paper}
      elevation={0}
      sx={{ 
        boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
        borderRadius: 3,
        overflow: 'hidden'
      }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'background.paperAlt' }}>
            <TableCell sx={{ fontWeight: 600 }}>Issue</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Reported</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {maintenanceRequests.map((request) => (
            <TableRow key={request.id} hover>
              <TableCell>{request.title}</TableCell>
              <TableCell>{request.unit}</TableCell>
              <TableCell>
                <StatusBadge status={request.status} />
              </TableCell>
              <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
              <TableCell align="right">
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
  
  // Financials Component
  const Financials = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card 
          elevation={0}
          sx={{ 
            boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            borderRadius: 3,
            height: '100%'
          }}
        >
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Monthly Summary</Typography>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="overline" color="text.secondary">Monthly Income</Typography>
                  <Typography variant="h5" fontWeight={500}>${financials.monthlyIncome}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="overline" color="text.secondary">Occupancy</Typography>
                  <Typography variant="h5" fontWeight={500}>{financials.occupancyRate}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="overline" color="text.secondary">Outstanding</Typography>
                  <Typography variant="h5" fontWeight={500}>${financials.outstandingPayments}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="overline" color="text.secondary">Expenses</Typography>
                  <Typography variant="h5" fontWeight={500}>${financials.expenses}</Typography>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card 
          elevation={0}
          sx={{ 
            boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            borderRadius: 3,
            height: '100%'
          }}
        >
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Recent Transactions</Typography>
            <List disablePadding>
              <ListItem>
                <ListItemText 
                  primary="Rent Payment - Unit 101" 
                  secondary="July 1, 2025" 
                />
                <Typography variant="body2" color="success.main" fontWeight={500}>+$1,500.00</Typography>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Maintenance - HVAC Repair" 
                  secondary="June 28, 2025" 
                />
                <Typography variant="body2" color="error.main" fontWeight={500}>-$350.00</Typography>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Rent Payment - Unit 201" 
                  secondary="June 30, 2025" 
                />
                <Typography variant="body2" color="success.main" fontWeight={500}>+$1,600.00</Typography>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Main render
  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
      <PageHeader
        title={selectedProperty.name}
        subtitle={selectedProperty.address}
        breadcrumbs={[
          { text: 'Properties', link: '/properties' },
          { text: selectedProperty.name }
        ]}
        action={
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        }
      />
      
      {/* Property summary card */}
      <Box mb={3}>
        <PropertySummary />
      </Box>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile}
          allowScrollButtonsMobile
          aria-label="property tabs"
          TabIndicatorProps={{
            sx: { backgroundColor: 'primary.main' }
          }}
        >
          <Tab icon={<HomeIcon />} label="Units" iconPosition="start" />
          <Tab icon={<PersonIcon />} label="Tenants" iconPosition="start" />
          <Tab icon={<BuildIcon />} label="Maintenance" iconPosition="start" />
          <Tab icon={<MoneyIcon />} label="Financials" iconPosition="start" />
          <Tab icon={<DocumentIcon />} label="Documents" iconPosition="start" />
        </Tabs>
      </Box>
      
      {/* Tab panels */}
      <Box>
        {activeTab === 0 && (
          <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>Units</Typography>
              <Button 
                variant="outlined" 
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Add Unit
              </Button>
            </Box>
            <UnitsTable />
          </Box>
        )}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>Tenants</Typography>
              <Button 
                variant="outlined" 
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Invite Tenant
              </Button>
            </Box>
            <TenantsTable />
          </Box>
        )}
        {activeTab === 2 && (
          <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>Maintenance Requests</Typography>
              <Button 
                variant="outlined" 
                size="small"
                sx={{ borderRadius: 2 }}
              >
                New Request
              </Button>
            </Box>
            <MaintenanceTable />
          </Box>
        )}
        {activeTab === 3 && (
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>Financial Overview</Typography>
            </Box>
            <Financials />
          </Box>
        )}
        {activeTab === 4 && (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="h6" color="text.secondary">Document management coming soon</Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 2, borderRadius: 2 }}
            >
              Upload Document
            </Button>
          </Box>
        )}
      </Box>
      
      {/* Property actions menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            borderRadius: 3,
            mt: 0.5
          }
        }}
      >
        <MenuItem onClick={handleEditProperty}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit Property
        </MenuItem>
        <MenuItem onClick={handleDeleteDialogOpen} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete Property
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        aria-labelledby="delete-property-dialog-title"
        aria-describedby="delete-property-dialog-description"
        PaperProps={{
          elevation: 0,
          sx: {
            boxShadow: '0px 2px 16px rgba(0,0,0,0.08)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle id="delete-property-dialog-title" sx={{ fontWeight: 600 }}>
          Delete Property
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-property-dialog-description">
            Are you sure you want to delete this property? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleDeleteDialogClose} 
            color="primary"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteProperty} 
            color="error"
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}