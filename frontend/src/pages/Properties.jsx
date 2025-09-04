// frontend/src/pages/Properties.jsx
import React, { useState, useEffect } from "react";
import { logger } from '../utils/logger';
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Typography,
  MenuItem,
  _IconButton,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import { Layout, PageHeader, PropertyCard, Empty, LoadingSpinner } from "../components";
import { useProperty, useApp } from "../context";

export default function Properties() {
  const navigate = useNavigate();
  const { properties, loading, error, fetchProperties, deleteProperty } = useProperty();
  const { updatePageTitle } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [propertyType, setPropertyType] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    updatePageTitle("Properties");
    fetchProperties();
  }, [updatePageTitle, fetchProperties]);

  // Fetch properties if not already available
  useEffect(() => {
    if (properties.length === 0 && !loading) {
      fetchProperties();
    }
  }, [properties.length, loading, fetchProperties]);

  // Filter and sort properties
  const filteredProperties = properties
    .filter(property => {
      // Search filter
      const matchesSearch = 
        property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Type filter
      const matchesType = propertyType === 'all' || property.type === propertyType;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'units') return (b.units?.length || 0) - (a.units?.length || 0);
      if (sortBy === 'vacancy') {
        const vacancyA = a.units ? a.units.filter(u => !u.tenant_id).length / a.units.length : 0;
        const vacancyB = b.units ? b.units.filter(u => !u.tenant_id).length / b.units.length : 0;
        return vacancyB - vacancyA;
      }
      return 0;
    });

  // Menu handlers
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handlePropertyClick = (id) => {
    navigate(`/properties/${id}`);
  };
  
  const handlePropertyActionClick = (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedPropertyId(id);
    setActionAnchorEl(event.currentTarget);
  };
  
  const handleActionClose = () => {
    setActionAnchorEl(null);
  };
  
  const handleAddProperty = () => {
    navigate('/properties/new');
  };

  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
    handleActionClose();
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteProperty = async () => {
    if (!selectedPropertyId) return;
    
    setIsDeleting(true);
    try {
      await deleteProperty(selectedPropertyId);
      setDeleteDialogOpen(false);
    } catch (error) {
      logger.error("Error deleting property:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Properties"
        subtitle="Manage your properties and units"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Properties' }
        ]}
        actionText="Add Property"
        actionIcon={<AddIcon />}
        onActionClick={handleAddProperty}
      />
      
      {/* Search and filters */}
      <Box sx={{ display: 'flex', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search properties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            )
          }}
          sx={{ 
            flexGrow: 1,
            minWidth: 200,
            "& .MuiOutlinedInput-root": {
              backgroundColor: 'background.paper',
              borderRadius: 2,
            }
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
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
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
          <Box sx={{ px: 2, pt: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>Property Type</Typography>
          </Box>
          <MenuItem 
            selected={propertyType === 'all'} 
            onClick={() => { setPropertyType('all'); handleFilterClose(); }}
          >
            All Types
          </MenuItem>
          <MenuItem 
            selected={propertyType === 'apartment'} 
            onClick={() => { setPropertyType('apartment'); handleFilterClose(); }}
          >
            Apartments
          </MenuItem>
          <MenuItem 
            selected={propertyType === 'house'} 
            onClick={() => { setPropertyType('house'); handleFilterClose(); }}
          >
            Houses
          </MenuItem>
          
          <Box sx={{ px: 2, pt: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>Sort By</Typography>
          </Box>
          <MenuItem 
            selected={sortBy === 'name'} 
            onClick={() => { setSortBy('name'); handleFilterClose(); }}
          >
            Name
          </MenuItem>
          <MenuItem 
            selected={sortBy === 'units'} 
            onClick={() => { setSortBy('units'); handleFilterClose(); }}
          >
            Number of Units
          </MenuItem>
          <MenuItem 
            selected={sortBy === 'vacancy'} 
            onClick={() => { setSortBy('vacancy'); handleFilterClose(); }}
          >
            Vacancy Rate
          </MenuItem>
        </Menu>
      </Box>
      
      {/* Properties Grid */}
      {loading ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <LoadingSpinner />
        </Box>
      ) : error ? (
        <Box sx={{ py: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : filteredProperties.length === 0 ? (
        <Empty 
          title={searchTerm ? "No matching properties" : "No properties yet"}
          message={searchTerm 
            ? "Try changing your search or filters"
            : "Add your first property to get started"
          }
          icon={<HomeIcon sx={{ fontSize: 64 }} />}
          actionText="Add Property"
          onActionClick={handleAddProperty}
        />
      ) : (
        <Grid container spacing={3}>
          {filteredProperties.map(property => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={property.id}>
              <PropertyCard
                id={property.id}
                name={property.name}
                address={property.address}
                city={property.city}
                state={property.state}
                zipCode={property.zip_code}
                imageUrl={property.image_url}
                type={property.type || 'apartment'}
                units={property.units?.length || 0}
                vacancyCount={property.units?.filter(u => !u.tenant_id).length || 0}
                onClick={() => handlePropertyClick(property.id)}
                onMenuClick={(e) => handlePropertyActionClick(e, property.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Property action menu */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleActionClose}
        PaperProps={{
          elevation: 0,
          sx: {
            boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            borderRadius: 3,
            mt: 0.5
          }
        }}
      >
        <MenuItem onClick={() => {
          navigate(`/properties/${selectedPropertyId}`);
          handleActionClose();
        }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/properties/${selectedPropertyId}/edit`);
          handleActionClose();
        }}>
          Edit Property
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/properties/${selectedPropertyId}/tenants`);
          handleActionClose();
        }}>
          Manage Tenants
        </MenuItem>
        <MenuItem onClick={handleDeleteDialogOpen} sx={{ color: 'error.main' }}>
          Delete Property
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        PaperProps={{
          elevation: 0,
          sx: {
            boxShadow: '0px 2px 16px rgba(0,0,0,0.08)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Property</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this property? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleDeleteDialogClose} 
            disabled={isDeleting}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={handleDeleteProperty} 
            disabled={isDeleting}
            autoFocus
            sx={{ borderRadius: 2 }}
          >
            {isDeleting ? <LoadingSpinner size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
