// src/pages/index.js
// Barrel file exporting all page components

// Auth/Account Pages
export { default as Login } from './Login';
export { default as Register } from './Register';
export { default as ForgotPassword } from './ForgotPassword';
export { default as ResetPassword } from './ResetPassword';
export { default as VerifyEmail } from './VerifyEmail';
export { default as Profile } from './Profile';

// Dashboard Pages
export { default as Dashboard } from './Dashboard';
export { default as Overview } from './Overview';
export { default as AdminDashboard } from './AdminDashboard';
export { default as ActivityFeed } from './ActivityFeed';

// Admin Pages
export * from './admin';

// Property Management
export { default as Properties } from './Properties';
export { default as PropertyDetail } from './PropertyDetail';
export { default as PropertyForm } from './PropertyForm';
export { default as JoinProperty } from './JoinProperty';

// Tenant Management
export { default as Tenants } from './Tenants';
export { default as TenantDetail } from './TenantDetail';
export { TenantForm } from './TenantForm';
export { default as InviteTenant } from './InviteTenant';

// Payment Management
export { default as Payments } from './Payments';
export { PaymentDetail } from './PaymentDetail';
export { default as PayPortal } from './PayPortal';

// Maintenance Management
export { default as Maintenance } from './Maintenance';
export { default as MaintenanceDetail } from './MaintenanceDetail';

// Communication
export { default as Messages } from './Messages';
export { default as MessagesPage } from './MessagesPage';
export { default as MessageDetail } from './MessageDetail';
export { default as MessageCreate } from './MessageCreate';
export { default as Notifications } from './Notifications';
export { NotificationDetail } from './NotificationDetail';

// Onboarding
export { default as LandlordOnboarding } from './LandlordOnboarding';
export { default as TenantOnboarding } from './TenantOnboarding';

// Other Pages
export { default as Calendar } from './Calendar';
export { default as Settings } from './Settings';
export { default as Support } from './Support';
export { default as Terms } from './Terms';
export { default as WelcomePage } from './WelcomePage';
export { default as RoutesIndex } from './RoutesIndex';

// Error Pages
export { default as NotFound } from './NotFound';
export { default as Unauthorized } from './Unauthorized';
