import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Create context
const TenantContext = createContext();
export { TenantContext };

export const TenantProvider = ({ children }) => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // Fetch all tenants
  const fetchTenants = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/tenants');
      setTenants(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError('Failed to load tenants');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Get a single tenant by ID
  const getTenant = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/tenants/${id}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching tenant ${id}:`, err);
      setError(`Failed to load tenant details`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new tenant
  const createTenant = useCallback(async (tenantData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/tenants', tenantData);
      
      // Update local state
      setTenants(prev => [...prev, response.data]);
      
      return response.data;
    } catch (err) {
      console.error('Error creating tenant:', err);
      setError(err.response?.data?.message || 'Failed to create tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing tenant
  const updateTenant = useCallback(async (id, tenantData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(`/api/tenants/${id}`, tenantData);
      
      // Update local state
      setTenants(prev => 
        prev.map(tenant => tenant.id === id ? response.data : tenant)
      );
      
      return response.data;
    } catch (err) {
      console.error(`Error updating tenant ${id}:`, err);
      setError(err.response?.data?.message || 'Failed to update tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a tenant
  const deleteTenant = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/tenants/${id}`);
      
      // Update local state
      setTenants(prev => prev.filter(tenant => tenant.id !== id));
      
      return true;
    } catch (err) {
      console.error(`Error deleting tenant ${id}:`, err);
      setError(err.response?.data?.message || 'Failed to delete tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Context value
  const value = {
    tenants,
    loading,
    error,
    fetchTenants,
    getTenant,
    createTenant,
    updateTenant,
    deleteTenant
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

// Custom hook
export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
