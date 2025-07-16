// filepath: /Users/mjoyner/Property/frontend/src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Create the context
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(notification => !notification.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      // Reset state when user logs out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      
      // Update state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      
      // Update state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Add a new notification (used for real-time updates)
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prevCount => prevCount + 1);
    }
  };

  // Clear a notification
  const clearNotification = async (notificationId) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      
      // Update state
      const notificationToRemove = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if needed
      if (notificationToRemove && !notificationToRemove.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (err) {
      console.error('Error removing notification:', err);
    }
  };

  // Set up WebSocket connection for real-time notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Initialize Socket.IO connection
    const socket = window.io ? window.io() : null;
    
    if (socket) {
      socket.on('notification', (data) => {
        addNotification(data);
      });
      
      return () => {
        socket.off('notification');
        socket.disconnect();
      };
    }
  }, [isAuthenticated]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};