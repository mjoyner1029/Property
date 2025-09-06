import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme'; // Use the real Asset Anchor theme
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { PropertyProvider } from './context/PropertyContext';
import { TenantProvider } from './context/TenantContext';
import { PaymentProvider } from './context/PaymentContext';
import { NotificationProvider } from './context/NotificationContext';
import { MessageProvider } from './context/MessageContext';
import { MaintenanceProvider } from './context/MaintenanceContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import MainLayout from './layouts/MainLayout'; // Use the real Asset Anchor MainLayout

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
// Admin pages
import { AdminOverview, UserManagement } from './pages/admin';
import AdminProperties from './pages/admin/AdminProperties';
import AdminTenants from './pages/admin/AdminTenants';

function App() {
  console.log('[App] Rendering Asset Anchor Property Management Dashboard...');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
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
                            <MainLayout>
                              <WelcomePage />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/dashboard" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <Dashboard />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/overview" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <Overview />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/calendar" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <Calendar />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/properties" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <Properties />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/properties/:id" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <PropertyDetail />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/properties/new" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <PropertyForm />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/properties/:id/edit" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <PropertyForm />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/maintenance" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <Maintenance />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/maintenance/:id" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <MaintenanceDetail />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/payments" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <Payments />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/payments/:id" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <PaymentDetail />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/tenants" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <Tenants />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/tenants/:id" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <TenantDetail />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/tenants/new" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <TenantForm />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/tenants/:id/edit" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <TenantForm />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/messages" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <MessagesPage />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/messages/:id" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <MessageDetail />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/messages/new" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <MessageCreate />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/notifications" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <Notifications />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/notifications/:id" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <NotificationDetail />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/activity" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <ActivityFeed />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <Profile />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/settings" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <Settings />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/support" element={
                          <ProtectedRoute>
                            <MainLayout>
                              <Support />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        {/* Admin routes */}
                        <Route path="/admin/overview" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <MainLayout>
                              <AdminOverview />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/admin/users" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <MainLayout>
                              <UserManagement />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        {/* Placeholder admin routes - can be implemented later */}
                        <Route path="/admin/properties" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <MainLayout>
                              <AdminProperties />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/admin/tenants" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <MainLayout>
                              <AdminTenants />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/admin/analytics" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <MainLayout>
                              <Overview />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/admin/support" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <MainLayout>
                              <Support />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/admin/settings" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <MainLayout>
                              <Settings />
                            </MainLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/admin/logs" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <MainLayout>
                              <ActivityFeed />
                            </MainLayout>
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
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
