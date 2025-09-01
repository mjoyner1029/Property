import React, { useState } from 'react';
import { Box, Button, MenuItem, Select, FormControl, InputLabel, Typography, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import MainLayout from './layouts/MainLayout';

// Import all pages
import WelcomePage from './pages/WelcomePage';
import Dashboard from './pages/Dashboard';
import Overview from './pages/Overview';
import Properties from './pages/Properties';
import PropertyForm from './pages/PropertyForm';
import PropertyDetail from './pages/PropertyDetail';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import Calendar from './pages/Calendar';
import Maintenance from './pages/Maintenance';
import MaintenanceDetail from './pages/MaintenanceDetail';
import Tenants from './pages/Tenants';
import TenantDetail from './pages/TenantDetail';
import MessagesPage from './pages/MessagesPage';
import Notifications from './pages/Notifications';
import PayPortal from './pages/PayPortal';
import Profile from './pages/Profile';
import Support from './pages/Support';
import Terms from './pages/Terms';
import ActivityFeed from './pages/ActivityFeed';
import AdminDashboard from './pages/AdminDashboard';
import InviteTenant from './pages/InviteTenant';
import JoinProperty from './pages/JoinProperty';
import LandlordOnboarding from './pages/LandlordOnboarding';
import TenantOnboarding from './pages/TenantOnboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

// Mock data provider for development viewing
const mockAuthContext = {
  user: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin'
  },
  isAuthenticated: true,
  isRole: (role) => true,
  loading: false,
  login: () => Promise.resolve({ success: true }),
  logout: () => Promise.resolve(),
  refreshToken: () => Promise.resolve()
};

// Mock property for PropertyDetail
const mockProperty = {
  id: 1,
  name: 'Sample Property',
  address: '123 Main St, Anytown, USA',
  units: 3,
  rent: 1500,
  status: 'active',
  maintenanceRequests: 2,
  imageUrl: 'https://via.placeholder.com/300'
};

// Mock maintenance request
const mockMaintenanceRequest = {
  id: 1,
  title: 'Leaking Faucet',
  description: 'The kitchen faucet has been leaking for 2 days',
  status: 'pending',
  priority: 'medium',
  createdAt: '2025-08-20T15:45:00.000Z',
  property: mockProperty
};

// All available pages
const pages = {
  'WelcomePage': { component: WelcomePage, layoutType: 'none', needsProps: false },
  'Login': { component: Login, layoutType: 'none', needsProps: false },
  'Register': { component: Register, layoutType: 'none', needsProps: false },
  'Dashboard': { component: Dashboard, layoutType: 'main', needsProps: false },
  'Overview': { component: Overview, layoutType: 'main', needsProps: false },
  'Properties': { component: Properties, layoutType: 'main', needsProps: false },
  'PropertyForm': { component: PropertyForm, layoutType: 'main', needsProps: false },
  'PropertyDetail': { component: PropertyDetail, layoutType: 'main', needsProps: true, props: { propertyId: 1, property: mockProperty } },
  'Payments': { component: Payments, layoutType: 'main', needsProps: false },
  'Calendar': { component: Calendar, layoutType: 'main', needsProps: false },
  'Maintenance': { component: Maintenance, layoutType: 'main', needsProps: false },
  'MaintenanceDetail': { component: MaintenanceDetail, layoutType: 'main', needsProps: true, props: { requestId: 1, request: mockMaintenanceRequest } },
  'Tenants': { component: Tenants, layoutType: 'main', needsProps: false },
  'TenantDetail': { component: TenantDetail, layoutType: 'main', needsProps: true, props: { tenantId: 1 } },
  'Settings': { component: Settings, layoutType: 'main', needsProps: false },
  'NotFound': { component: NotFound, layoutType: 'none', needsProps: false },
  'Unauthorized': { component: Unauthorized, layoutType: 'none', needsProps: false },
  'MessagesPage': { component: MessagesPage, layoutType: 'main', needsProps: false },
  'Notifications': { component: Notifications, layoutType: 'main', needsProps: false },
  'PayPortal': { component: PayPortal, layoutType: 'main', needsProps: false },
  'Profile': { component: Profile, layoutType: 'main', needsProps: false },
  'Support': { component: Support, layoutType: 'main', needsProps: false },
  'Terms': { component: Terms, layoutType: 'none', needsProps: false },
  'ActivityFeed': { component: ActivityFeed, layoutType: 'main', needsProps: false },
  'AdminDashboard': { component: AdminDashboard, layoutType: 'main', needsProps: false },
  'InviteTenant': { component: InviteTenant, layoutType: 'main', needsProps: false },
  'JoinProperty': { component: JoinProperty, layoutType: 'none', needsProps: false },
  'LandlordOnboarding': { component: LandlordOnboarding, layoutType: 'none', needsProps: false },
  'TenantOnboarding': { component: TenantOnboarding, layoutType: 'none', needsProps: false },
  'ForgotPassword': { component: ForgotPassword, layoutType: 'none', needsProps: false },
  'ResetPassword': { component: ResetPassword, layoutType: 'none', needsProps: false },
  'VerifyEmail': { component: VerifyEmail, layoutType: 'none', needsProps: false },
};

export function DevPageViewer() {
  const [selectedPage, setSelectedPage] = useState('');
  const [helpOpen, setHelpOpen] = useState(true);
  
  // Helper to render the selected component
  const renderComponent = () => {
    if (!selectedPage || !pages[selectedPage]) return null;
    
    const { component: Component, layoutType, needsProps, props } = pages[selectedPage];
    
    // If the component needs a layout
    if (layoutType === 'main') {
      return (
        <div className="dev-preview">
          <MainLayout>
            {needsProps ? <Component {...props} /> : <Component />}
          </MainLayout>
        </div>
      );
    }
    
    // No layout needed
    return (
      <div className="dev-preview">
        {needsProps ? <Component {...props} /> : <Component />}
      </div>
    );
  };

  return (
    <Box sx={{ p: 0, m: 0, height: '100vh', width: '100vw' }}>
      {/* Page selector */}
      <Box sx={{ 
        p: 2, 
        backgroundColor: '#2c3e50', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999
      }}>
        <Typography variant="h6">Development Page Viewer</Typography>
        
        <FormControl sx={{ m: 1, minWidth: 200 }}>
          <InputLabel id="page-select-label" sx={{ color: 'white' }}>Select Page</InputLabel>
          <Select
            labelId="page-select-label"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            label="Select Page"
            sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
          >
            {Object.keys(pages).map(pageName => (
              <MenuItem key={pageName} value={pageName}>{pageName}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button 
          variant="outlined" 
          color="inherit"
          onClick={() => setHelpOpen(true)}
        >
          Help
        </Button>
      </Box>
      
      {/* Main content area */}
      <Box sx={{ pt: 8 }}>
        {selectedPage ? (
          <React.Fragment>
            {renderComponent()}
          </React.Fragment>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
            <Paper sx={{ p: 4, maxWidth: 600 }}>
              <Typography variant="h5" gutterBottom>Welcome to Development Page Viewer</Typography>
              <Typography paragraph>
                Select a page from the dropdown above to preview it without having to log in.
                This tool allows you to view any page of the application without authentication.
              </Typography>
              <Typography paragraph>
                Pages are rendered with mock data where necessary.
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>
      
      {/* Help dialog */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Development Page Viewer Help</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            This tool allows you to view any page of the application without needing to authenticate.
            Simply select a page from the dropdown menu to see it rendered with mock data.
          </Typography>
          <Typography variant="h6" gutterBottom>Features:</Typography>
          <ul>
            <li>View any page without logging in</li>
            <li>Pages that normally require authentication are accessible</li>
            <li>Mock data is provided where needed</li>
            <li>Layouts are applied automatically based on page requirements</li>
          </ul>
          <Typography variant="h6" gutterBottom>Notes:</Typography>
          <Typography paragraph>
            This is only for UI development and testing. Backend functionality will not work.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)} color="primary">Got it!</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DevPageViewer;
