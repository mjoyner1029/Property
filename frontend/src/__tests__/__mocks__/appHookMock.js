import React from 'react';

// Mock AppContext hook
export const useAppMock = {
  updatePageTitle: jest.fn(),
  theme: 'light',
  toggleTheme: jest.fn(),
  isHeaderVisible: true,
  showHeader: jest.fn(),
  hideHeader: jest.fn()
};

export default useAppMock;
