// frontend/src/pages/PropertyForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';

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

  // Property context
  const {
    selectedProperty,
    loading,
    error,
    createProperty,
    updateProperty,
    fetchPropertyById,
  } = useProperty();

  // App context
  const { updatePageTitle } = useApp();

  const isEditMode = Boolean(id);

  // Form state
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
  });

  // Image handling
  const [imageFiles, setImageFiles] = useState([]); // newly added File objects
  const [previewUrls, setPreviewUrls] = useState([]); // array of strings (blob: or remote URLs)
  const [existingImageUrls, setExistingImageUrls] = useState([]); // server images for this property
  const [removedExistingImageUrls, setRemovedExistingImageUrls] = useState([]); // track which existing images were removed

  // Submit state
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Title + initial fetch
  useEffect(() => {
    if (isEditMode) {
      updatePageTitle('Edit Property');
      fetchPropertyById(id);
    } else {
      updatePageTitle('Add Property');
    }
  }, [id, isEditMode, fetchPropertyById, updatePageTitle]);

  // Populate form when editing and property data arrives
  useEffect(() => {
    if (!isEditMode || !selectedProperty) return;

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
    });

    // Normalize existing images into URLs (support [{url}, ...] or [string, ...])
    const urls =
      Array.isArray(selectedProperty.images)
        ? selectedProperty.images.map((img) => (typeof img === 'string' ? img : img?.url)).filter(Boolean)
        : [];

    setExistingImageUrls(urls);
    setPreviewUrls(urls);
    setRemovedExistingImageUrls([]);
    setImageFiles([]);
  }, [isEditMode, selectedProperty]);

  // Revoke blob URLs when they’re removed or on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((u) => {
        if (typeof u === 'string' && u.startsWith('blob:')) {
          URL.revokeObjectURL(u);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basic validators/normalizers
  const validators = useMemo(
    () => ({
      state: (v) => v.toUpperCase().slice(0, 2),
      zip_code: (v) => v.replace(/[^\d-]/g, '').slice(0, 10),
      year_built: (v) => v.replace(/[^\d]/g, '').slice(0, 4),
      square_feet: (v) => v.replace(/[^\d]/g, '').slice(0, 9),
    }),
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    const normalize =
      name in validators ? validators[name](value ?? '') : value ?? '';
    setFormData((prev) => ({ ...prev, [name]: normalize }));
  };

  // Handle uploads from FileUpload
  const handleImageUpload = (filesLike) => {
    const files = Array.from(filesLike || []);
    if (!files.length) return;

    const newBlobUrls = files.map((file) => URL.createObjectURL(file));

    setImageFiles((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [...prev, ...newBlobUrls]);
  };

  // Remove an image at a given preview index
  const handleRemoveImage = (index) => {
    setPreviewUrls((prev) => {
      const target = prev[index];
      // If this was a blob URL, revoke it
      if (typeof target === 'string' && target.startsWith('blob:')) {
        URL.revokeObjectURL(target);
      }

      // If this was an existing server image, mark it for removal
      if (existingImageUrls.includes(target)) {
        setRemovedExistingImageUrls((r) => [...r, target]);
        setExistingImageUrls((e) => e.filter((u) => u !== target));
      } else {
        // Otherwise it belonged to newly added files; remove the corresponding File
        // Find its position among only the blob URLs we added (after existing ones)
        const blobIndexAmongNew = prev
          .map((u, i) => ({ u, i }))
          .filter(({ u }) => typeof u === 'string' && u.startsWith('blob:'))
          .findIndex(({ i }) => i === index);

        if (blobIndexAmongNew > -1) {
          setImageFiles((prevFiles) =>
            prevFiles.filter((_, i) => i !== blobIndexAmongNew)
          );
        }
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  // Build payload: if new files exist, send multipart; else JSON
  const buildPayload = () => {
    const hasNewFiles = imageFiles.length > 0;

    if (hasNewFiles) {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        fd.append(k, v == null ? '' : String(v));
      });
      imageFiles.forEach((file) => fd.append('images', file));
      if (isEditMode && removedExistingImageUrls.length) {
        fd.append(
          'removed_images',
          JSON.stringify(removedExistingImageUrls)
        );
      }
      return fd;
    }

    const json = {
      ...formData,
      removed_images: isEditMode && removedExistingImageUrls.length
        ? removedExistingImageUrls
        : [],
    };
    return json;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitLoading(true);

    try {
      const payload = buildPayload();

      if (isEditMode) {
        await updateProperty(id, payload);
      } else {
        await createProperty(payload);
      }

      navigate('/properties');
    } catch (err) {
      const msg =
        (err && (err.message || err.error || err.toString())) ||
        'Failed to save property';
      setSubmitError(msg);
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
        title={isEditMode ? 'Edit Property' : 'Add New Property'}
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Properties', link: '/properties' },
          { text: isEditMode ? 'Edit' : 'Add' },
        ]}
        actionText="Back to Properties"
        actionIcon={<ArrowBackIcon />}
        onActionClick={() => navigate('/properties')}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {String(error)}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                elevation: 0,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                borderRadius: 3,
              }}
            >
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
                      inputProps={{ 'aria-label': 'Property name' }}
                      InputProps={{ sx: { borderRadius: 2 } }}
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
                      inputProps={{ 'aria-label': 'Property type' }}
                      InputProps={{ sx: { borderRadius: 2 } }}
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
                      InputProps={{ sx: { borderRadius: 2 } }}
                    />
                  </Grid>
                </Grid>
              </FormSection>

              <FormSection title="Location" description="Enter the address information">
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Street Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      inputProps={{ 'aria-label': 'Property address' }}
                      InputProps={{ sx: { borderRadius: 2 } }}
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
                      InputProps={{ sx: { borderRadius: 2 } }}
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
                      placeholder="CA"
                      InputProps={{ sx: { borderRadius: 2 } }}
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
                      placeholder="94404"
                      InputProps={{ sx: { borderRadius: 2 } }}
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
                      type="text"
                      value={formData.year_built}
                      onChange={handleChange}
                      placeholder="E.g. 1990"
                      InputProps={{ sx: { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Square Footage"
                      name="square_feet"
                      type="text"
                      value={formData.square_feet}
                      onChange={handleChange}
                      placeholder="Total square footage"
                      InputProps={{ sx: { borderRadius: 2 } }}
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
                      InputProps={{ sx: { borderRadius: 2 } }}
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
                borderRadius: 3,
              }}
            >
              <Box sx={{ mb: 3 }}>
                <FileUpload
                  onUpload={handleImageUpload}
                  multiple
                  accept="image/*"
                  maxFiles={5}
                  maxSize={5 * 1024 * 1024}
                  sx={{
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                  }}
                />
              </Box>

              {previewUrls.length > 0 ? (
                <Grid container spacing={1}>
                  {previewUrls.map((url, index) => (
                    <Grid item xs={6} key={`${url}-${index}`}>
                      <Box
                        role="img"
                        aria-label={`Property image ${index + 1}`}
                        sx={{
                          position: 'relative',
                          height: 100,
                          borderRadius: 2,
                          overflow: 'hidden',
                          backgroundImage: `url(${url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          '&:hover button': { opacity: 1 },
                        }}
                      >
                        <Button
                          size="small"
                          color="error"
                          variant="contained"
                          aria-label={`Remove image ${index + 1}`}
                          sx={{
                            position: 'absolute',
                            top: 5,
                            right: 5,
                            minWidth: 'auto',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            borderRadius: 1,
                            p: 0.5,
                            lineHeight: 0,
                          }}
                          onClick={() => handleRemoveImage(index)}
                        >
                          <CloseIcon fontSize="small" />
                        </Button>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
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
                aria-label="Save property details"
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                {submitLoading ? (
                  <CircularProgress size={24} />
                ) : isEditMode ? (
                  'Save Changes'
                ) : (
                  'Create Property'
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
                sx={{ mt: 2, py: 1.5, borderRadius: 2 }}
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
