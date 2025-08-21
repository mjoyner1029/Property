import React, { Suspense } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CombinedProviders } from './context/index';
import theme from './theme';

// Layouts
import MainLayout from './layouts/MainLayout';

// Route Guards
import { ProtectedRoute, PublicRoute, RoleRoute } from './routing/guards';

// Loading Fallback
import LoadingFallback from './components/LoadingFallback';

// lazy pages
const WelcomePage = React.lazy(() => import('./pages/WelcomePage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Overview = React.lazy(() => import('./pages/Overview'));
const Properties = React.lazy(() => import('./pages/Properties'));
const PropertyForm = React.lazy(() => import('./pages/PropertyForm'));
const PropertyDetail = React.lazy(() => import('./pages/PropertyDetail'));
const Payments = React.lazy(() => import('./pages/Payments'));
const Settings = React.lazy(() => import('./pages/Settings'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Unauthorized = React.lazy(() => import('./pages/Unauthorized'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const Maintenance = React.lazy(() => import('./pages/Maintenance'));
const MaintenanceDetail = React.lazy(() => import('./pages/MaintenanceDetail'));
const Tenants = React.lazy(() => import('./pages/Tenants'));
const TenantDetail = React.lazy(() => import('./pages/TenantDetail'));
const Messages = React.lazy(() => import('./pages/Messages'));
const MessagesPage = React.lazy(() => import('./pages/MessagesPage'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const PayPortal = React.lazy(() => import('./pages/PayPortal'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Support = React.lazy(() => import('./pages/Support'));
const Terms = React.lazy(() => import('./pages/Terms'));
const ActivityFeed = React.lazy(() => import('./pages/ActivityFeed'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const InviteTenant = React.lazy(() => import('./pages/InviteTenant'));
const JoinProperty = React.lazy(() => import('./pages/JoinProperty'));
const LandlordOnboarding = React.lazy(() => import('./pages/LandlordOnboarding'));
const TenantOnboarding = React.lazy(() => import('./pages/TenantOnboarding'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));
const RoutesIndex = React.lazy(() => import('./pages/RoutesIndex'));

// Import the error boundary and toast components
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';

// Import the error boundary and toast components
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <CombinedProviders>
          <MuiThemeProvider theme={theme}>
            <CssBaseline />
            <Toast />
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route element={<PublicRoute />}>
                  <Route path="/" element={<WelcomePage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/terms" element={<Terms />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  } />
                  <Route path="/dashboard/overview" element={
                    <MainLayout>
                      <Overview />
                    </MainLayout>
                  } />
                  <Route path="/dashboard/calendar" element={
                    <MainLayout>
                      <Calendar />
                    </MainLayout>
                  } />
                  <Route path="/properties" element={
                    <MainLayout>
                      <Properties />
                    </MainLayout>
                  } />
                  <Route path="/properties/add" element={
                    <MainLayout>
                      <PropertyForm />
                    </MainLayout>
                  } />
                  <Route path="/properties/:id" element={
                    <MainLayout>
                      <PropertyDetail />
                    </MainLayout>
                  } />
                  <Route path="/properties/:id/edit" element={
                    <MainLayout>
                      <PropertyForm />
                    </MainLayout>
                  } />
                  <Route path="/maintenance" element={
                    <MainLayout>
                      <Maintenance />
                    </MainLayout>
                  } />
                  <Route path="/maintenance/:id" element={
                    <MainLayout>
                      <MaintenanceDetail />
                    </MainLayout>
                  } />
                  <Route path="/payments" element={
                    <MainLayout>
                      <Payments />
                    </MainLayout>
                  } />
                  <Route path="/settings" element={
                    <MainLayout>
                      <Settings />
                    </MainLayout>
                  } />
                  <Route path="/messages" element={
                    <MainLayout>
                      <MessagesPage />
                    </MainLayout>
                  } />
                  <Route path="/support" element={
                    <MainLayout>
                      <Support />
                    </MainLayout>
                  } />
                  <Route path="/notifications" element={
                    <MainLayout>
                      <Notifications />
                    </MainLayout>
                  } />
                  <Route path="/activity" element={
                    <MainLayout>
                      <ActivityFeed />
                    </MainLayout>
                  } />
                  <Route path="/profile" element={
                    <MainLayout>
                      <Profile />
                    </MainLayout>
                  } />
                </Route>

                <Route element={<RoleRoute roles={['tenant']} />}>
                  <Route path="/pay-portal" element={
                    <MainLayout>
                      <PayPortal />
                    </MainLayout>
                  } />
                  <Route path="/join-property" element={
                    <MainLayout>
                      <JoinProperty />
                    </MainLayout>
                  } />
                  <Route path="/tenant/onboarding" element={<TenantOnboarding />} />
                </Route>

                <Route element={<RoleRoute roles={['landlord', 'admin']} />}>
                  <Route path="/tenants" element={
                    <MainLayout>
                      <Tenants />
                    </MainLayout>
                  } />
                  <Route path="/tenants/:id" element={
                    <MainLayout>
                      <TenantDetail />
                    </MainLayout>
                  } />
                  <Route path="/invite-tenant" element={
                    <MainLayout>
                      <InviteTenant />
                    </MainLayout>
                  } />
                  <Route path="/landlord/onboarding" element={<LandlordOnboarding />} />
                </Route>

                <Route element={<RoleRoute roles={['admin']} />}>
                  <Route path="/admin" element={
                    <MainLayout>
                      <AdminDashboard />
                    </MainLayout>
                  } />
                </Route>

                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </MuiThemeProvider>
        </CombinedProviders>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
