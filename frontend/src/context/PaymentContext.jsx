import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

// Create context
export const PaymentContext = createContext();

export const PaymentProvider = ({ children }) => {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  // Fetch all payments based on user role
  const fetchPayments = useCallback(async () => {
    // Wait for auth to be fully ready
    if (!isAuthenticated || authLoading) return;
    
    // Also ensure we have user data
    if (!user?.role) {
      console.log("PaymentContext: Waiting for user role...");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let endpoint = '/api/payments';
      
      // Use role-specific endpoints if needed
      if (user?.role === 'tenant') {
        endpoint = '/api/payments/tenant';
      }
      
      const response = await api.get(endpoint.replace('/api', ''));
      setPayments(response.data.payments || response.data);
      return response.data.payments || response.data;
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading]);

  // Get a single payment by ID
  const getPayment = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/payments/${id}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching payment ${id}:`, err);
      setError(`Failed to load payment details`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new payment
  const createPayment = useCallback(async (paymentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/payments', paymentData);
      
      // Update local state
      setPayments(prev => [...prev, response.data]);
      
      return response.data;
    } catch (err) {
      console.error('Error creating payment:', err);
      setError(err.response?.data?.message || 'Failed to create payment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Make a payment (tenant side)
  const makePayment = useCallback(async (paymentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/payments/pay', paymentData);
      
      // Update local state
      setPayments(prev => {
        const updatedPayments = [...prev];
        const index = updatedPayments.findIndex(p => p.id === response.data.id);
        
        if (index !== -1) {
          updatedPayments[index] = response.data;
        } else {
          updatedPayments.push(response.data);
        }
        
        return updatedPayments;
      });
      
      return response.data;
    } catch (err) {
      console.error('Error making payment:', err);
      setError(err.response?.data?.message || 'Failed to process payment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a payment
  const updatePayment = useCallback(async (id, paymentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put(`/payments/${id}`, paymentData);
      
      // Update local state
      setPayments(prev => 
        prev.map(payment => payment.id === id ? response.data : payment)
      );
      
      return response.data;
    } catch (err) {
      console.error(`Error updating payment ${id}:`, err);
      setError(err.response?.data?.message || 'Failed to update payment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a payment
  const deletePayment = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.delete(`/payments/${id}`);
      
      // Update local state
      setPayments(prev => prev.filter(payment => payment.id !== id));
      
      return true;
    } catch (err) {
      console.error(`Error deleting payment ${id}:`, err);
      setError(err.response?.data?.message || 'Failed to delete payment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Context value
  const value = {
    payments,
    loading,
    error,
    fetchPayments,
    getPayment,
    createPayment,
    makePayment,
    updatePayment,
    deletePayment
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

// Custom hook
export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};
