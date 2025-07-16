import { AuthProvider, useAuth, withAuth } from './AuthContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import { NotificationProvider, useNotifications } from './NotificationContext';
import { MaintenanceProvider, useMaintenance } from './MaintenanceContext';
import { PropertyProvider, useProperty } from './PropertyContext';
import { AppProvider, useApp } from './AppContext';

// Combined provider for easier imports
const CombinedProviders = ({ children }) => (
  <ThemeProvider>
    <AppProvider>
      <AuthProvider>
        <NotificationProvider>
          <PropertyProvider>
            <MaintenanceProvider>
              {children}
            </MaintenanceProvider>
          </PropertyProvider>
        </NotificationProvider>
      </AuthProvider>
    </AppProvider>
  </ThemeProvider>
);

export {
  CombinedProviders,
  AuthProvider,
  useAuth,
  withAuth,
  ThemeProvider,
  useTheme,
  NotificationProvider,
  useNotifications,
  MaintenanceProvider,
  useMaintenance,
  PropertyProvider,
  useProperty,
  AppProvider,
  useApp
};