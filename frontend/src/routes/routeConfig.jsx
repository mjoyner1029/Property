/**
 * Routes Configuration
 * Central place to define all application routes
 */

const routeConfig = [
  {
    path: '/',
    component: 'WelcomePage',
    guard: 'public',
    layout: false,
  },
  {
    path: '/dashboard',
    component: 'Dashboard',
    guard: 'private',
    layout: true,
  },
  {
    path: '/overview',
    component: 'Overview',
    guard: 'private',
    layout: true,
  },
  {
    path: '/calendar',
    component: 'Calendar',
    guard: 'private',
    layout: true,
  },
  {
    path: '/properties',
    component: 'Properties',
    guard: 'private',
    layout: true,
  },
  {
    path: '/properties/new',
    component: 'PropertyForm',
    guard: 'private',
    layout: true,
  },
  {
    path: '/properties/:id',
    component: 'PropertyDetail',
    guard: 'private',
    layout: true,
  },
  {
    path: '/maintenance',
    component: 'Maintenance',
    guard: 'private',
    layout: true,
  },
  {
    path: '/maintenance/:id',
    component: 'MaintenanceDetail',
    guard: 'private',
    layout: true,
  },
  {
    path: '/tenants',
    component: 'Tenants',
    guard: 'private',
    layout: true,
  },
  {
    path: '/tenants/:id',
    component: 'TenantDetail',
    guard: 'private',
    layout: true,
  },
  {
    path: '/messages',
    component: 'Messages',
    guard: 'private',
    layout: true,
  },
  {
    path: '/messages/:threadId',
    component: 'MessagesPage',
    guard: 'private',
    layout: true,
  },
  {
    path: '/notifications',
    component: 'Notifications',
    guard: 'private',
    layout: true,
  },
  {
    path: '/payments',
    component: 'Payments',
    guard: 'private',
    layout: true,
  },
  {
    path: '/profile',
    component: 'Profile',
    guard: 'private',
    layout: true,
  },
  {
    path: '/settings',
    component: 'Settings',
    guard: 'private',
    layout: true,
  },
  {
    path: '/support',
    component: 'Support',
    guard: 'private',
    layout: true,
  },
  {
    path: '/terms',
    component: 'Terms',
    guard: 'private',
    layout: true,
  },
  {
    path: '/activity',
    component: 'ActivityFeed',
    guard: 'private',
    layout: true,
  },
  {
    path: '/admin',
    component: 'AdminDashboard',
    guard: 'role',
    role: 'admin',
    layout: true,
  },
  {
    path: '/invite-tenant',
    component: 'InviteTenant',
    guard: 'role',
    role: 'landlord',
    layout: true,
  },
  {
    path: '/join-property',
    component: 'JoinProperty',
    guard: 'role',
    role: 'tenant',
    layout: true,
  },
  {
    path: '/landlord-onboarding',
    component: 'LandlordOnboarding',
    guard: 'role',
    role: 'landlord',
    layout: false,
  },
  {
    path: '/tenant-onboarding',
    component: 'TenantOnboarding',
    guard: 'role',
    role: 'tenant',
    layout: false,
  },
  {
    path: '/login',
    component: 'Login',
    guard: 'public',
    layout: false,
  },
  {
    path: '/register',
    component: 'Register',
    guard: 'public',
    layout: false,
  },
  {
    path: '/forgot-password',
    component: 'ForgotPassword',
    guard: 'public',
    layout: false,
  },
  {
    path: '/reset-password',
    component: 'ResetPassword',
    guard: 'public',
    layout: false,
  },
  {
    path: '/verify-email',
    component: 'VerifyEmail',
    guard: 'public',
    layout: false,
  },
  {
    path: '/unauthorized',
    component: 'Unauthorized',
    guard: 'public',
    layout: false,
  },
  {
    path: '/dev/routes',
    component: 'RoutesIndex',
    guard: 'devOnly',
    layout: false,
  },
  {
    path: '*',
    component: 'NotFound',
    guard: 'public',
    layout: false,
  },
];

export default routeConfig;
