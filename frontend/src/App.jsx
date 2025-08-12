import React, { Suspense } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CombinedProviders } from './context/index';
import theme from './theme';

// Layouts
import MainLayout from './layouts/MainLayout';

// Route Guards
import { PublicRoute, PrivateRoute, RoleRoute } from './routes/guards';

// Route Config
import routeConfig from './routes/routeConfig';

// Loading Fallback
import LoadingFallback from './components/LoadingFallback';

/**
 * Lazy load all pages to improve initial load performance
 */
const WelcomePage = React.lazy(() => import('./pages/WelcomePage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Overview = React.lazy(() => import('./pages/Overview'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const Properties = React.lazy(() => import('./pages/Properties'));
const PropertyForm = React.lazy(() => import('./pages/PropertyForm'));
const PropertyDetail = React.lazy(() => import('./pages/PropertyDetail'));
const Maintenance = React.lazy(() => import('./pages/Maintenance'));
const MaintenanceDetail = React.lazy(() => import('./pages/MaintenanceDetail'));
const Tenants = React.lazy(() => import('./pages/Tenants'));
const TenantDetail = React.lazy(() => import('./pages/TenantDetail'));
const Messages = React.lazy(() => import('./pages/Messages'));
const MessagesPage = React.lazy(() => import('./pages/MessagesPage'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Payments = React.lazy(() => import('./pages/Payments'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));
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
const Unauthorized = React.lazy(() => import('./pages/Unauthorized'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const RoutesIndex = React.lazy(() => import('./pages/RoutesIndex'));

// Component mapping for easy lookup from the route config
const componentMap = {
  WelcomePage,
  Dashboard,
  Overview,
  Calendar,
  Properties,
  PropertyForm,
  PropertyDetail,
  Maintenance,
  MaintenanceDetail,
  Tenants,
  TenantDetail,
  Messages,
  MessagesPage,
  Notifications,
  Payments,
  Profile,
  Settings,
  Support,
  Terms,
  ActivityFeed,
  AdminDashboard,
  InviteTenant,
  JoinProperty,
  LandlordOnboarding,
  TenantOnboarding,
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  VerifyEmail,
  Unauthorized,
  NotFound,
  RoutesIndex
};

// The main App content component containing routes
const AppContent = () => {
  return (
    <Routes>
      {routeConfig.map((route, index) => {
        // Get the component from our component map
        const Component = componentMap[route.component];
        
        // Skip if component doesn't exist
        if (!Component) {
          console.error(`Component ${route.component} not found for route ${route.path}`);
          return null;
        }
        
        // Determine which type of route guard to use
        let RouteElement = null;
        
        if (route.guard === 'public') {
          RouteElement = (
            <PublicRoute>
              <Suspense fallback={<LoadingFallback />}>
                {route.layout ? (
                  <MainLayout>
                    <Component />
                  </MainLayout>
                ) : (
                  <Component />
                )}
              </Suspense>
            </PublicRoute>
          );
        } else if (route.guard === 'private') {
          RouteElement = (
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                {route.layout ? (
                  <MainLayout>
                    <Component />
                  </MainLayout>
                ) : (
                  <Component />
                )}
              </Suspense>
            </PrivateRoute>
          );
        } else if (route.guard === 'role') {
          RouteElement = (
            <RoleRoute role={route.role}>
              <Suspense fallback={<LoadingFallback />}>
                {route.layout ? (
                  <MainLayout>
                    <Component />
                  </MainLayout>
                ) : (
                  <Component />
                )}
              </Suspense>
            </RoleRoute>
          );
        } else if (route.guard === 'devOnly') {
          // Only show dev routes when not in production
          RouteElement = (
            <Suspense fallback={<LoadingFallback />}>
              <Component />
            </Suspense>
          );
        }
        
        return <Route key={index} path={route.path} element={RouteElement} />;
      })}
      {routeConfig.map((route, index) => {
        // Get the component from our component map
        const Component = componentMap[route.component];
        
        // Skip if component doesn't exist
        if (!Component) {
          console.error(`Component ${route.component} not found for route ${route.path}`);
          return null;
        }
        
        // Determine which type of route guard to use
        let RouteElement = null;
        
        if (route.guard === 'public') {
          RouteElement = (
            <PublicRoute>
              <Suspense fallback={<LoadingFallback />}>
                {route.layout ? (
                  <MainLayout>
                    <Component />
                  </MainLayout>
                ) : (
                  <Component />
                )}
              </Suspense>
            </PublicRoute>
          );
        } else if (route.guard === 'private') {
          RouteElement = (
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                {route.layout ? (
                  <MainLayout>
                    <Component />
                  </MainLayout>
                ) : (
                  <Component />
                )}
              </Suspense>
            </PrivateRoute>
          );
        } else if (route.guard === 'role') {
          RouteElement = (
            <RoleRoute role={route.role}>
              <Suspense fallback={<LoadingFallback />}>
                {route.layout ? (
                  <MainLayout>
                    <Component />
                  </MainLayout>
                ) : (
                  <Component />
                )}
              </Suspense>
            </RoleRoute>
          );
        } else if (route.guard === 'devOnly') {
          // Only show dev routes when not in production
          RouteElement = (
            <Suspense fallback={<LoadingFallback />}>
              <Component />
            </Suspense>
          );
        }
        
        return <Route key={index} path={route.path} element={RouteElement} />;
      })}
      
      {/* Dashboard sub-routes */}
      <Route
        path="/dashboard/overview"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Overview />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/calendar"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Calendar />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Property routes */}
      <Route
        path="/properties"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Properties />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/properties/add"
        element={
          <ProtectedRoute roles={["landlord", "admin"]}>
            <MainLayout>
              <PropertyForm />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/properties/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PropertyDetail />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/properties/:id/edit"
        element={
          <ProtectedRoute roles={["landlord", "admin"]}>
            <MainLayout>
              <PropertyForm />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Maintenance routes */}
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Maintenance />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <MaintenanceDetail />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Payment routes */}
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Payments />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pay-portal"
        element={
          <ProtectedRoute roles={["tenant"]}>
            <MainLayout>
              <PayPortal />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Tenant routes */}
      <Route
        path="/tenants"
        element={
          <ProtectedRoute roles={["landlord", "admin"]}>
            <MainLayout>
              <Tenants />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenants/:id"
        element={
          <ProtectedRoute roles={["landlord", "admin"]}>
            <MainLayout>
              <TenantDetail />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invite-tenant"
        element={
          <ProtectedRoute roles={["landlord", "admin"]}>
            <MainLayout>
              <InviteTenant />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/join-property"
        element={
          <ProtectedRoute roles={["tenant"]}>
            <MainLayout>
              <JoinProperty />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Messages routes */}
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <MainLayout>
              <MessagesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Other routes */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Settings />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Support />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Notifications />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ActivityFeed />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Onboarding routes - Note: These don't use MainLayout which may be intentional */}
      <Route
        path="/landlord/onboarding"
        element={
          <ProtectedRoute roles={["landlord"]}>
            <LandlordOnboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenant/onboarding"
        element={
          <ProtectedRoute roles={["tenant"]}>
            <TenantOnboarding />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
    </Routes>
  );
};

// Wrap the entire app with BrowserRouter first, then providers
const App = () => (
  <BrowserRouter>
    <CombinedProviders>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </MuiThemeProvider>
    </CombinedProviders>
  </BrowserRouter>
);

export default App;
