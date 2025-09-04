import React, { Suspense, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Routes, Route } from 'react-router-dom';

// Local imports
import { CombinedProviders } from './context/index';
import theme from './theme';
import { initSentry } from './observability/sentry';
import PerformanceMonitor from './observability/PerformanceMonitor';
// Layouts
import MainLayout from './layouts/MainLayout';
// Route Guards
import { ProtectedRoute, PublicOnlyRoute as PublicRoute, RoleRoute } from './routing/guards';
// Loading Fallback
import LoadingFallback from './components/LoadingFallback';
import ErrorBoundary from './components/ErrorBoundary'; // We'll keep using the original ErrorBoundary for now
import Toast from './components/Toast';

// Determine if we're in demo mode
const isDemoMode = process.env.REACT_APP_DEMO_MODE === '1';

// Demo mode wrapper to inject demo auth context or use regular context
const DemoModeWrapper = ({ children }) => {
  console.log('DemoModeWrapper - isDemoMode:', isDemoMode);
  
  // In demo mode, the DemoAuthProvider is already provided at the root level
  if (isDemoMode) {
    // Log that we're using demo auth provider
    console.log('🔮 Using demo auth provider - skipping CombinedProviders');
    
    // Note: We'll only return non-auth related providers from CombinedProviders
    // since DemoAuthProvider is already provided at the root level
    return <>{children}</>;
  } else {
    // In normal mode, use the CombinedProviders
    console.log('Using regular auth provider via CombinedProviders');
    return <CombinedProviders>{children}</CombinedProviders>;
  }
};

// lazy pages - import from barrel index
const WelcomePage = React.lazy(() => import('./pages').then(m => ({ default: m.WelcomePage })));
const Dashboard = React.lazy(() => import('./pages').then(m => ({ default: m.Dashboard })));
const Overview = React.lazy(() => import('./pages').then(m => ({ default: m.Overview })));
const Properties = React.lazy(() => import('./pages').then(m => ({ default: m.Properties })));
const PropertyForm = React.lazy(() => import('./pages').then(m => ({ default: m.PropertyForm })));
const PropertyDetail = React.lazy(() => import('./pages').then(m => ({ default: m.PropertyDetail })));
const Payments = React.lazy(() => import('./pages').then(m => ({ default: m.Payments })));
const PaymentDetail = React.lazy(() => import('./pages').then(m => ({ default: m.PaymentDetail })));
const Settings = React.lazy(() => import('./pages').then(m => ({ default: m.Settings })));
const NotFound = React.lazy(() => import('./pages').then(m => ({ default: m.NotFound })));
const Unauthorized = React.lazy(() => import('./pages').then(m => ({ default: m.Unauthorized })));
const Calendar = React.lazy(() => import('./pages').then(m => ({ default: m.Calendar })));
const Maintenance = React.lazy(() => import('./pages').then(m => ({ default: m.Maintenance })));
const MaintenanceDetail = React.lazy(() => import('./pages').then(m => ({ default: m.MaintenanceDetail })));
const Tenants = React.lazy(() => import('./pages').then(m => ({ default: m.Tenants })));
const TenantDetail = React.lazy(() => import('./pages').then(m => ({ default: m.TenantDetail })));
const TenantForm = React.lazy(() => import('./pages').then(m => ({ default: m.TenantForm })));
const Messages = React.lazy(() => import('./pages').then(m => ({ default: m.Messages })));
const MessagesPage = React.lazy(() => import('./pages').then(m => ({ default: m.MessagesPage })));
const MessageDetail = React.lazy(() => import('./pages').then(m => ({ default: m.MessageDetail })));
const MessageCreate = React.lazy(() => import('./pages').then(m => ({ default: m.MessageCreate })));
const Notifications = React.lazy(() => import('./pages').then(m => ({ default: m.Notifications })));
const NotificationDetail = React.lazy(() => import('./pages').then(m => ({ default: m.NotificationDetail })));
const PayPortal = React.lazy(() => import('./pages').then(m => ({ default: m.PayPortal })));
const Profile = React.lazy(() => import('./pages').then(m => ({ default: m.Profile })));
const Support = React.lazy(() => import('./pages').then(m => ({ default: m.Support })));
const Terms = React.lazy(() => import('./pages').then(m => ({ default: m.Terms })));
const ActivityFeed = React.lazy(() => import('./pages').then(m => ({ default: m.ActivityFeed })));
const AdminDashboard = React.lazy(() => import('./pages').then(m => ({ default: m.AdminDashboard })));
const InviteTenant = React.lazy(() => import('./pages').then(m => ({ default: m.InviteTenant })));
const JoinProperty = React.lazy(() => import('./pages').then(m => ({ default: m.JoinProperty })));
const LandlordOnboarding = React.lazy(() => import('./pages').then(m => ({ default: m.LandlordOnboarding })));
const TenantOnboarding = React.lazy(() => import('./pages').then(m => ({ default: m.TenantOnboarding })));
const Login = React.lazy(() => import('./pages').then(m => ({ default: m.Login })));
const Register = React.lazy(() => import('./pages').then(m => ({ default: m.Register })));
const ForgotPassword = React.lazy(() => import('./pages').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = React.lazy(() => import('./pages').then(m => ({ default: m.ResetPassword })));
const VerifyEmail = React.lazy(() => import('./pages').then(m => ({ default: m.VerifyEmail })));
const RoutesIndex = React.lazy(() => import('./pages').then(m => ({ default: m.RoutesIndex })));


export default function App() {
  // Initialize Sentry for error tracking and performance monitoring
  useEffect(() => {
    // Initialize Sentry early in the app lifecycle, only if REACT_APP_SENTRY_DSN is set
    const sentryInitialized = initSentry();
    console.debug(`Sentry initialization ${sentryInitialized ? 'successful' : 'skipped'}`);
    
    // Mark navigation start for performance measurement
    if (window.performance && window.performance.mark) {
      window.performance.mark('app-init');
    }
    
    // Preload critical resources on idle
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => {
        // Add preload/prefetch links for critical resources
        const preconnectUrls = [
          window.location.origin,
          'https://fonts.googleapis.com',
          'https://fonts.gstatic.com'
        ];
        
        preconnectUrls.forEach(url => {
          const link = document.createElement('link');
          link.rel = 'preconnect';
          link.href = url;
          document.head.appendChild(link);
        });
      });
    }
    
    // Add a demo mode indicator to the console
    if (isDemoMode) {
      console.log('%c🔮 DEMO MODE ACTIVE', 'background: #6366f1; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
    }
  }, []);
  
  return (
    <ErrorBoundary>
      <DemoModeWrapper>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <Toast />
          <PerformanceMonitor />
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
                  <Route path="/payments/:id" element={
                    <MainLayout>
                      <PaymentDetail />
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
                  <Route path="/messages/new" element={
                    <MainLayout>
                      <MessageCreate />
                    </MainLayout>
                  } />
                  <Route path="/messages/:threadId/detail" element={
                    <MainLayout>
                      <MessageDetail />
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
                  <Route path="/notifications/:id" element={
                    <MainLayout>
                      <NotificationDetail />
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
                  <Route path="/tenants/new" element={
                    <MainLayout>
                      <TenantForm />
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
        </DemoModeWrapper>
      </ErrorBoundary>
  );
}
