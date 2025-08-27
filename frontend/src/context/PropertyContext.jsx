import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Create the context
export const PropertyContext = createContext();

export const PropertyProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    occupancyRate: 0
  });
  
  const { isAuthenticated, user } = useAuth();

  // Fetch properties based on user role
  const fetchProperties = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Determine endpoint based on user role
      let endpoint = '/api/properties';
      
      const response = await axios.get(endpoint);
      setProperties(response.data);
      
      // Calculate statistics
      let totalUnits = 0;
      let occupiedUnits = 0;
      
      response.data.forEach(property => {
        if (property.units) {
          totalUnits += property.units.length;
          occupiedUnits += property.units.filter(unit => unit.tenant_id).length;
        }
      });
      
      const vacantUnits = totalUnits - occupiedUnits;
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
      
      setStats({
        totalProperties: response.data.length,
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
  }, [isAuthenticated]);

  // Load properties when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchProperties();
    } else {
      // Reset state when user logs out
      setProperties([]);
      setSelectedProperty(null);
    }
  }, [isAuthenticated, fetchProperties]);

  // Fetch a single property by ID
  const fetchPropertyById = async (propertyId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/properties/${propertyId}`);
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
      
      const response = await axios.post('/api/properties', formData, {
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
      
      const response = await axios.put(`/api/properties/${propertyId}`, formData, {
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
      await axios.delete(`/api/properties/${propertyId}`);
      
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