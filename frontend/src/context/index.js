import { AuthProvider, useAuth, withAuth } from './AuthContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import { NotificationProvider, useNotifications } from './NotificationContext';
import { MaintenanceProvider, useMaintenance } from './MaintenanceContext';
import { PropertyProvider, useProperty } from './PropertyContext';
import { AppProvider, useApp } from './AppContext';
import { FeedbackProvider, useFeedback } from './FeedbackContext';

// Combined provider for easier imports
const CombinedProviders = ({ children }) => (
  <FeedbackProvider>
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
  </FeedbackProvider>
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
  useApp,
  FeedbackProvider,
  useFeedback
};