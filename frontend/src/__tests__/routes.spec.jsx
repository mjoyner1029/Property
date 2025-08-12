import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import routeConfig from '../routes/routeConfig';

// Required routes according to specification
const requiredRoutes = [
  '/',
  '/dashboard',
  '/overview',
  '/calendar',
  '/properties',
  '/properties/new',
  '/properties/:id',
  '/maintenance',
  '/maintenance/:id',
  '/tenants',
  '/tenants/:id',
  '/messages',
  '/messages/:threadId',
  '/notifications',
  '/payments',
  '/profile',
  '/settings',
  '/support',
  '/terms',
  '/activity',
  '/admin',
  '/invite-tenant',
  '/join-property',
  '/landlord-onboarding',
  '/tenant-onboarding',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/unauthorized',
  '/dev/routes',
  '*'
];

describe('Application Routes', () => {
  it('should have all required routes defined', () => {
    // Get all defined paths in the route config
    const definedPaths = routeConfig.map(route => route.path);
    
    // Check that all required routes are defined
    for (const requiredRoute of requiredRoutes) {
      expect(definedPaths).toContain(requiredRoute);
    }
  });
  
  it('should have correct components for each route', () => {
    // Map of required components for each path
    const requiredComponents = {
      '/': 'WelcomePage',
      '/dashboard': 'Dashboard',
      '/overview': 'Overview',
      '/calendar': 'Calendar',
      '/properties': 'Properties',
      '/properties/new': 'PropertyForm',
      '/properties/:id': 'PropertyDetail',
      '/maintenance': 'Maintenance',
      '/maintenance/:id': 'MaintenanceDetail',
      '/tenants': 'Tenants',
      '/tenants/:id': 'TenantDetail',
      '/messages': 'Messages',
      '/messages/:threadId': 'MessagesPage',
      '/notifications': 'Notifications',
      '/payments': 'Payments',
      '/profile': 'Profile',
      '/settings': 'Settings',
      '/support': 'Support',
      '/terms': 'Terms',
      '/activity': 'ActivityFeed',
      '/admin': 'AdminDashboard',
      '/invite-tenant': 'InviteTenant',
      '/join-property': 'JoinProperty',
      '/landlord-onboarding': 'LandlordOnboarding',
      '/tenant-onboarding': 'TenantOnboarding',
      '/login': 'Login',
      '/register': 'Register',
      '/forgot-password': 'ForgotPassword',
      '/reset-password': 'ResetPassword',
      '/verify-email': 'VerifyEmail',
      '/unauthorized': 'Unauthorized',
      '/dev/routes': 'RoutesIndex',
      '*': 'NotFound'
    };
    
    // Check each route has the correct component
    for (const route of routeConfig) {
      const expectedComponent = requiredComponents[route.path];
      expect(route.component).toBe(expectedComponent);
    }
  });
  
  it('should have correct role guards for protected routes', () => {
    const roleProtectedRoutes = {
      '/admin': 'admin',
      '/invite-tenant': 'landlord',
      '/join-property': 'tenant',
      '/landlord-onboarding': 'landlord',
      '/tenant-onboarding': 'tenant'
    };
    
    // Check role-protected routes have correct role
    for (const path in roleProtectedRoutes) {
      const route = routeConfig.find(r => r.path === path);
      expect(route).toBeDefined();
      expect(route.guard).toBe('role');
      expect(route.role).toBe(roleProtectedRoutes[path]);
    }
  });
});
