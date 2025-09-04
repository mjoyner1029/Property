// src/test/mocks/pageTitle.js
// Create mock variables
const updatePageTitleMock = jest.fn();
// Don't use hooks at the top level
const toggleDarkModeMock = jest.fn();
const isDarkModeMock = false;
const isMobileMock = false;
const themeMock = { 
  palette: { 
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' }
  } 
};

// Mock App context
const AppContextMock = {
  updatePageTitle: updatePageTitleMock,
  toggleDarkMode: toggleDarkModeMock,
  isDarkMode: isDarkModeMock,
  isMobile: isMobileMock,
  theme: themeMock
};

// CommonJS exports for use with require()
module.exports = {
  updatePageTitleMock,
  toggleDarkModeMock,
  isDarkModeMock,
  isMobileMock,
  themeMock,
  AppContextMock,
  // Helper function to get the full app context
  useApp: () => AppContextMock,
  // For mocking the provider in tests
  AppProvider: function AppProvider(props) { return props.children; }
};
