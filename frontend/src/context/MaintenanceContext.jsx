import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Create the context
const MaintenanceContext = createContext();

export const MaintenanceProvider = ({ children }) => {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    completed: 0,
    total: 0
  });
  
  const { isAuthenticated, user } = useAuth();

  // Fetch maintenance requests based on user role
  const fetchRequests = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('User is not authenticated, skipping maintenance request fetch');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        setError('Authentication token missing');
        setLoading(false);
        return;
      }
      
      // Set headers with token
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      // Determine endpoint based on user role
      let endpoint = '/api/maintenance/';
      
      if (user?.role === 'tenant') {
        endpoint = '/api/maintenance/tenant';
      } else if (user?.role === 'landlord') {
        endpoint = '/api/maintenance/landlord';
      }
      
      console.log(`Fetching maintenance requests from: ${endpoint} with role: ${user?.role}`);
      
      const response = await axios.get(endpoint, { headers });
      console.log('Maintenance API response:', response.data);
      
      // Check if response data is in expected format
      const requestsData = response.data.requests || response.data || [];
      setMaintenanceRequests(requestsData);
      
      // Calculate stats
      const stats = {
        open: requestsData.filter(req => req.status === 'open').length,
        inProgress: requestsData.filter(req => req.status === 'in_progress').length,
        completed: requestsData.filter(req => req.status === 'completed').length,
        total: requestsData.length
      };
      
      setStats(stats);
    } catch (err) {
      console.error('Error fetching maintenance requests:', err);
      setError(err.response?.data?.error || 'Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load requests when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchRequests();
    } else {
      // Reset state when user logs out
      setMaintenanceRequests([]);
    }
  }, [isAuthenticated, fetchRequests]);

  // Create a new maintenance request
  const createRequest = async (requestData) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(requestData).forEach(key => {
        if (key !== 'images' && requestData[key] !== undefined) {
          formData.append(key, requestData[key]);
        }
      });
      
      // Add images if any
      if (requestData.images && requestData.images.length > 0) {
        requestData.images.forEach(image => {
          formData.append('images', image);
        });
      }
      
      const response = await axios.post('/api/maintenance', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update state with new request
      setMaintenanceRequests(prev => [response.data, ...prev]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        open: prev.open + 1,
        total: prev.total + 1
      }));
      
      return response.data;
    } catch (err) {
      console.error('Error creating maintenance request:', err);
      setError(err.response?.data?.error || 'Failed to create maintenance request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update a maintenance request
  const updateRequest = async (id, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(`/api/maintenance/${id}`, updateData);
      
      // Update state
      setMaintenanceRequests(prev => 
        prev.map(req => req.id === id ? response.data : req)
      );
      
      // Update stats if status changed
      const oldRequest = maintenanceRequests.find(req => req.id === id);
      if (oldRequest && oldRequest.status !== response.data.status) {
        setStats(prev => {
          const newStats = { ...prev };
          
          // Decrement old status count
          if (oldRequest.status === 'open') newStats.open--;
          else if (oldRequest.status === 'in_progress') newStats.inProgress--;
          else if (oldRequest.status === 'completed') newStats.completed--;
          
          // Increment new status count
          if (response.data.status === 'open') newStats.open++;
          else if (response.data.status === 'in_progress') newStats.inProgress++;
          else if (response.data.status === 'completed') newStats.completed++;
          
          return newStats;
        });
      }
      
      return response.data;
    } catch (err) {
      console.error('Error updating maintenance request:', err);
      setError(err.response?.data?.error || 'Failed to update maintenance request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a maintenance request
  const deleteRequest = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/maintenance/${id}`);
      
      // Find the request to update stats properly
      const requestToDelete = maintenanceRequests.find(req => req.id === id);
      
      // Update state
      setMaintenanceRequests(prev => prev.filter(req => req.id !== id));
      
      // Update stats
      if (requestToDelete) {
        setStats(prev => {
          const newStats = { ...prev, total: prev.total - 1 };
          
          if (requestToDelete.status === 'open') newStats.open--;
          else if (requestToDelete.status === 'in_progress') newStats.inProgress--;
          else if (requestToDelete.status === 'completed') newStats.completed--;
          
          return newStats;
        });
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting maintenance request:', err);
      setError(err.response?.data?.error || 'Failed to delete maintenance request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    maintenanceRequests,
    stats,
    loading,
    error,
    fetchRequests,
    createRequest,
    updateRequest,
    deleteRequest
  };

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};