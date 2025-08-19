import React, { createContext, useContext } from 'react';

const defaultValue = {
  isDrawerOpen: false,
  setIsDrawerOpen: jest.fn(),
  toggleDrawer: jest.fn(),
  isMobile: false,
  pageTitle: 'Test Page',
  updatePageTitle: jest.fn(),
  appReady: true,
  globalError: null,
  setGlobalError: jest.fn(),
  systemHealth: {
    status: 'healthy',
    services: {
      api: { status: 'up', message: 'API is available' }
    }
  },
  clearGlobalError: jest.fn(),
  setPageAction: jest.fn(),
  pageAction: null
};

export const AppContext = createContext(defaultValue);

export const AppProvider = ({ children, value = defaultValue }) => {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);

export default AppContext;
