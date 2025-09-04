import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Create the context
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 960);
  const [pageTitle, setPageTitle] = useState('');
  const [appReady, setAppReady] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [systemHealth, setSystemHealth] = useState({
    status: 'unknown',
    services: {}
  });

  // Check if device is mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 960);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize app and check system status
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check API status
        const response = await axios.get('/api/status');
        setSystemHealth({
          status: 'healthy',
          services: response.data
        });
      } catch (err) {
        console.error('API status check failed:', err);
        setSystemHealth({
          status: 'unhealthy',
          services: {
            api: { status: 'down', message: 'API is unavailable' }
          }
        });
      } finally {
        // Mark app as ready even if there were errors
        setAppReady(true);
      }
    };

    initializeApp();
  }, []);

  // Toggle drawer state
  const toggleDrawer = () => {
    setIsDrawerOpen(prev => !prev);
  };

  // Close drawer (especially useful on mobile)
  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Set the current page title
  const updatePageTitle = (title) => {
    setPageTitle(title);
    // Also update document title
    document.title = title ? `${title} | Asset Anchor` : 'Asset Anchor';
  };

  // Set global error
  const showGlobalError = (message, autoHideAfter = 5000) => {
    setGlobalError(message);
    
    if (autoHideAfter > 0) {
      setTimeout(() => {
        setGlobalError(null);
      }, autoHideAfter);
    }
  };

  // Clear global error
  const clearGlobalError = () => {
    setGlobalError(null);
  };

  const value = {
    isDrawerOpen,
    isMobile,
    pageTitle,
    appReady,
    globalError,
    systemHealth,
    toggleDrawer,
    closeDrawer,
    updatePageTitle,
    showGlobalError,
    clearGlobalError
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};