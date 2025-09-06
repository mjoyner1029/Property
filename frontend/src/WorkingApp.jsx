import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { PropertyProvider } from './context/PropertyContext';
import { TenantProvider } from './context/TenantContext';
import { PaymentProvider } from './context/PaymentContext';
import { NotificationProvider } from './context/NotificationContext';
import { MessageProvider } from './context/MessageContext';
import { MaintenanceProvider } from './context/MaintenanceContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import Layout from './components/Layout';

// Import pages that actually exist
import WelcomePage from './pages/WelcomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Overview from './pages/Overview';
import Calendar from './pages/Calendar';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import PropertyForm from './pages/PropertyForm';
import Maintenance from './pages/Maintenance';
import MaintenanceDetail from './pages/MaintenanceDetail';
import Payments from './pages/Payments';
import PaymentDetail from './pages/PaymentDetail';
import Settings from './pages/Settings';
import MessagesPage from './pages/MessagesPage';
import MessageDetail from './pages/MessageDetail';
import MessageCreate from './pages/MessageCreate';
import Notifications from './pages/Notifications';
import NotificationDetail from './pages/NotificationDetail';
import ActivityFeed from './pages/ActivityFeed';
import Profile from './pages/Profile';
import Tenants from './pages/Tenants';
import TenantDetail from './pages/TenantDetail';
import TenantForm from './pages/TenantForm';
import Support from './pages/Support';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

// Create Asset Anchor theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function WorkingApp() {
  console.log('[WorkingApp] Rendering Asset Anchor Property Management Dashboard...');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <PropertyProvider>
          <TenantProvider>
            <PaymentProvider>
              <NotificationProvider>
                <MessageProvider>
                  <MaintenanceProvider>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/verify-email" element={<VerifyEmail />} />
                        <Route path="/unauthorized" element={<Unauthorized />} />
                        
                        {/* Protected routes with layout */}
                        <Route path="/" element={
                          <ProtectedRoute>
                            <Layout>
                              <WelcomePage />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/dashboard" element={
                          <ProtectedRoute>
                            <Layout>
                              <Dashboard />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/overview" element={
                          <ProtectedRoute>
                            <Layout>
                              <Overview />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/calendar" element={
                          <ProtectedRoute>
                            <Layout>
                              <Calendar />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/properties" element={
                          <ProtectedRoute>
                            <Layout>
                              <Properties />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/properties/:id" element={
                          <ProtectedRoute>
                            <Layout>
                              <PropertyDetail />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/properties/new" element={
                          <ProtectedRoute>
                            <Layout>
                              <PropertyForm />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/properties/:id/edit" element={
                          <ProtectedRoute>
                            <Layout>
                              <PropertyForm />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/maintenance" element={
                          <ProtectedRoute>
                            <Layout>
                              <Maintenance />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/maintenance/:id" element={
                          <ProtectedRoute>
                            <Layout>
                              <MaintenanceDetail />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/payments" element={
                          <ProtectedRoute>
                            <Layout>
                              <Payments />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/payments/:id" element={
                          <ProtectedRoute>
                            <Layout>
                              <PaymentDetail />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/tenants" element={
                          <ProtectedRoute>
                            <Layout>
                              <Tenants />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/tenants/:id" element={
                          <ProtectedRoute>
                            <Layout>
                              <TenantDetail />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/tenants/new" element={
                          <ProtectedRoute>
                            <Layout>
                              <TenantForm />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/tenants/:id/edit" element={
                          <ProtectedRoute>
                            <Layout>
                              <TenantForm />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/messages" element={
                          <ProtectedRoute>
                            <Layout>
                              <MessagesPage />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/messages/:id" element={
                          <ProtectedRoute>
                            <Layout>
                              <MessageDetail />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/messages/new" element={
                          <ProtectedRoute>
                            <Layout>
                              <MessageCreate />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/notifications" element={
                          <ProtectedRoute>
                            <Layout>
                              <Notifications />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/notifications/:id" element={
                          <ProtectedRoute>
                            <Layout>
                              <NotificationDetail />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/activity" element={
                          <ProtectedRoute>
                            <Layout>
                              <ActivityFeed />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <Layout>
                              <Profile />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/settings" element={
                          <ProtectedRoute>
                            <Layout>
                              <Settings />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/support" element={
                          <ProtectedRoute>
                            <Layout>
                              <Support />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        {/* Catch all route */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </MaintenanceProvider>
                </MessageProvider>
              </NotificationProvider>
            </PaymentProvider>
          </TenantProvider>
        </PropertyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default WorkingApp;
