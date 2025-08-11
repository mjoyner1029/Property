import { AuthProvider, useAuth, withAuth } from './AuthContext.jsx';
import { ThemeProvider, useTheme } from './ThemeContext.jsx';
import { NotificationProvider, useNotifications } from './NotificationContext.jsx';
import { MaintenanceProvider, useMaintenance } from './MaintenanceContext.jsx';
import { PropertyProvider, useProperty } from './PropertyContext.jsx';
import { AppProvider, useApp } from './AppContext.jsx';
import { TenantProvider, useTenant } from './TenantContext.jsx';
import { PaymentProvider, usePayment } from './PaymentContext.jsx';

// Combined provider for easier imports
const CombinedProviders = ({ children }) => (
  <ThemeProvider>
    <AppProvider>
      <AuthProvider>
        <NotificationProvider>
          <PropertyProvider>
            <MaintenanceProvider>
              <TenantProvider>
                <PaymentProvider>
                  {children}
                </PaymentProvider>
              </TenantProvider>
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
  useApp,
  TenantProvider,
  useTenant,
  PaymentProvider,
  usePayment
};