import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

// Create the context
export const PropertyContext = createContext();

export const PropertyProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    occupancyRate: 0
  });
  
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  // Fetch properties based on user role
  const fetchProperties = useCallback(async () => {
    // Wait for auth to be fully ready
    if (!isAuthenticated || authLoading) return;
    
    // Ensure we have user data before making API calls
    if (!user?.role) {
      console.log("PropertyContext: Waiting for user role...");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Determine endpoint based on user role
      let endpoint = '/properties';
      
      // Admin users should use the admin endpoint for comprehensive property data
      if (user.role === 'admin') {
        endpoint = '/admin/properties';
      }
      
      const response = await api.get(endpoint);
      
      // Handle different response structures
      let propertiesData = [];
      if (Array.isArray(response.data)) {
        // Direct array response
        propertiesData = response.data;
      } else if (response.data && Array.isArray(response.data.properties)) {
        // Object with properties array
        propertiesData = response.data.properties;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Nested data structure
        propertiesData = response.data.data;
      } else {
        console.warn('PropertyContext: Unexpected response structure:', response.data);
        propertiesData = [];
      }
      
      setProperties(propertiesData);
      
      // Calculate statistics
      let totalUnits = 0;
      let occupiedUnits = 0;
      
      propertiesData.forEach(property => {
        // Handle different property structures based on endpoint
        if (user.role === 'admin') {
          // Admin endpoint returns unit_count and tenant_count
          totalUnits += property.unit_count || 0;
          occupiedUnits += property.tenant_count || 0;
        } else {
          // Regular endpoint returns units array
          if (property.units) {
            totalUnits += property.units.length;
            occupiedUnits += property.units.filter(unit => unit.tenant_id).length;
          }
        }
      });
      
      const vacantUnits = totalUnits - occupiedUnits;
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
      
      setStats({
        totalProperties: propertiesData.length,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        occupancyRate
      });
      
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading]);

  // Load properties when user is authenticated and ready
  useEffect(() => {
    if (isAuthenticated && !authLoading && user?.role) {
      fetchProperties();
    } else {
      // Reset state when user logs out
      setProperties([]);
      setSelectedProperty(null);
    }
    }, [isAuthenticated, user, authLoading]);

  // Fetch a single property by ID
  const fetchPropertyById = async (propertyId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/properties/${propertyId}`);
      setSelectedProperty(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching property details:', err);
      setError('Failed to load property details');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create a new property
  const createProperty = async (propertyData) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(propertyData).forEach(key => {
        if (key !== 'images' && propertyData[key] !== undefined) {
          formData.append(key, propertyData[key]);
        }
      });
      
      // Add images if any
      if (propertyData.images && propertyData.images.length > 0) {
        propertyData.images.forEach(image => {
          formData.append('images', image);
        });
      }
      
      const response = await api.post('/properties', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update state with new property
      setProperties(prev => [...prev, response.data]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalProperties: prev.totalProperties + 1
      }));
      
      return response.data;
    } catch (err) {
      console.error('Error creating property:', err);
      setError(err.response?.data?.error || 'Failed to create property');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing property
  const updateProperty = async (propertyId, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(updateData).forEach(key => {
        if (key !== 'images' && updateData[key] !== undefined) {
          formData.append(key, updateData[key]);
        }
      });
      
      // Add new images if any
      if (updateData.images && updateData.images.length > 0) {
        updateData.images.forEach(image => {
          formData.append('images', image);
        });
      }
      
      const response = await api.put(`/properties/${propertyId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update properties list
      setProperties(prev => prev.map(p => p.id === propertyId ? response.data : p));
      
      // Update selected property if it's the one being updated
      if (selectedProperty && selectedProperty.id === propertyId) {
        setSelectedProperty(response.data);
      }
      
      return response.data;
    } catch (err) {
      console.error('Error updating property:', err);
      setError(err.response?.data?.error || 'Failed to update property');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a property
  const deleteProperty = async (propertyId) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.delete(`/properties/${propertyId}`);
      
      // Update state
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      
      if (selectedProperty && selectedProperty.id === propertyId) {
        setSelectedProperty(null);
      }
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalProperties: prev.totalProperties - 1
      }));
      
      return true;
    } catch (err) {
      console.error('Error deleting property:', err);
      setError(err.response?.data?.error || 'Failed to delete property');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    properties,
    selectedProperty,
    stats,
    loading,
    error,
    fetchProperties,
    fetchPropertyById,
    createProperty,
    updateProperty,
    deleteProperty
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};