// Mock implementation of AppContext hooks
export const mockAppHook = {
  pageTitle: "Test Page",
  updatePageTitle: jest.fn(),
  isDrawerOpen: false,
  toggleDrawer: jest.fn(),
  setDrawerOpen: jest.fn(),
  addAlert: jest.fn(),
  removeAlert: jest.fn(),
  alerts: [],
  theme: "light",
  toggleTheme: jest.fn(),
  setTheme: jest.fn()
};
