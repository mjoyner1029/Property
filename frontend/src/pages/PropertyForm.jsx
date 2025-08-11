import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { Layout, PageHeader, FormSection, Card, FileUpload } from '../components';
import { useProperty, useApp } from '../context';

const propertyTypes = [
  { value: 'apartment', label: 'Apartment Building' },
  { value: 'house', label: 'Single Family House' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'condo', label: 'Condominium' },
  { value: 'commercial', label: 'Commercial Property' }
];

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedProperty, loading, error, createProperty, updateProperty, fetchPropertyById } = useProperty();
  const { updatePageTitle } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'apartment',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    description: '',
    year_built: '',
    square_feet: '',
    amenities: '',
    images: []
  });
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  
  const isEditMode = Boolean(id);
  
  // Fetch property data for edit mode
  useEffect(() => {
    if (isEditMode) {
      updatePageTitle("Edit Property");
      fetchPropertyById(id);
    } else {
      updatePageTitle("Add Property");
    }
  }, [id, isEditMode, fetchPropertyById, updatePageTitle]);
  
  // Populate form when property data is loaded
  useEffect(() => {
    if (isEditMode && selectedProperty) {
      setFormData({
        name: selectedProperty.name || '',
        type: selectedProperty.type || 'apartment',
        address: selectedProperty.address || '',
        city: selectedProperty.city || '',
        state: selectedProperty.state || '',
        zip_code: selectedProperty.zip_code || '',
        description: selectedProperty.description || '',
        year_built: selectedProperty.year_built || '',
        square_feet: selectedProperty.square_feet || '',
        amenities: selectedProperty.amenities || '',
        images: []
      });
      
      if (selectedProperty.images) {
        setPreviewUrls(selectedProperty.images.map(img => img.url));
      }
    }
  }, [selectedProperty, isEditMode]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle image upload
  const handleImageUpload = (files) => {
    setImageFiles(files);
    
    // Create preview URLs
    const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    
    // Add to form data
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
  };
  
  // Handle image removal
  const handleRemoveImage = (index) => {
    // Remove from preview
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    
    // Remove from files
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    
    // Remove from form data
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
  
  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError('');
    
    try {
      if (isEditMode) {
        await updateProperty(id, formData);
      } else {
        await createProperty(formData);
      }
      navigate('/properties');
    } catch (err) {
      setSubmitError(err.message || 'Failed to save property');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  if (loading && isEditMode) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <PageHeader
        title={isEditMode ? "Edit Property" : "Add New Property"}
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Properties', link: '/properties' },
          { text: isEditMode ? 'Edit' : 'Add' }
        ]}
        actionText="Back to Properties"
        actionIcon={<ArrowBackIcon />}
        onActionClick={() => navigate('/properties')}
      />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ 
              elevation: 0,
              boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
              borderRadius: 3 
            }}>
              <FormSection
                title="Basic Information"
                description="Enter the general details about this property"
              >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Property Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="E.g. Sunset Apartments"
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Property Type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    >
                      {propertyTypes.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      multiline
                      rows={3}
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Brief description of the property"
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                </Grid>
              </FormSection>
              
              <FormSection
                title="Location"
                description="Enter the address information"
              >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Street Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      required
                      label="State"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      required
                      label="ZIP Code"
                      name="zip_code"
                      value={formData.zip_code}
                      onChange={handleChange}
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                </Grid>
              </FormSection>
              
              <FormSection
                title="Property Details"
                description="Additional information about the property"
                divider={false}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Year Built"
                      name="year_built"
                      type="number"
                      value={formData.year_built}
                      onChange={handleChange}
                      placeholder="E.g. 1990"
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Square Footage"
                      name="square_feet"
                      type="number"
                      value={formData.square_feet}
                      onChange={handleChange}
                      placeholder="Total square footage"
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Amenities"
                      name="amenities"
                      multiline
                      rows={2}
                      value={formData.amenities}
                      onChange={handleChange}
                      placeholder="E.g. Pool, Gym, Parking"
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                </Grid>
              </FormSection>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card 
              title="Property Images"
              sx={{ 
                elevation: 0,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                borderRadius: 3 
              }}
            >
              <Box sx={{ mb: 3 }}>
                <FileUpload
                  onUpload={handleImageUpload}
                  multiple
                  accept="image/*"
                  maxFiles={5}
                  maxSize={5 * 1024 * 1024} // 5MB
                  sx={{ 
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2
                  }}
                />
              </Box>
              
              {previewUrls.length > 0 && (
                <Grid container spacing={1}>
                  {previewUrls.map((url, index) => (
                    <Grid item xs={6} key={index}>
                      <Box
                        sx={{
                          position: 'relative',
                          height: 100,
                          borderRadius: 2,
                          overflow: 'hidden',
                          backgroundImage: `url(${url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          '&:hover button': {
                            opacity: 1
                          }
                        }}
                      >
                        <Button
                          size="small"
                          color="error"
                          variant="contained"
                          sx={{
                            position: 'absolute',
                            top: 5,
                            right: 5,
                            minWidth: 'auto',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            borderRadius: 1
                          }}
                          onClick={() => handleRemoveImage(index)}
                        >
                          ✕
                        </Button>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
              
              {previewUrls.length === 0 && (
                <Typography color="text.secondary" textAlign="center">
                  No images uploaded yet
                </Typography>
              )}
            </Card>
            
            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                startIcon={submitLoading ? null : <SaveIcon />}
                disabled={submitLoading}
                sx={{ 
                  py: 1.5,
                  borderRadius: 2
                }}
              >
                {submitLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  isEditMode ? 'Save Changes' : 'Create Property'
                )}
              </Button>
              
              {submitError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {submitError}
                </Alert>
              )}
              
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                fullWidth
                onClick={() => navigate('/properties')}
                sx={{ 
                  mt: 2,
                  py: 1.5,
                  borderRadius: 2
                }}
              >
                Cancel
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Layout>
  );
}