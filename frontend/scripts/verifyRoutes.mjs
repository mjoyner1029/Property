#!/usr/bin/env node

/**
 * Verify Routes Script
 * 
 * This script checks that all required routes are properly defined in routeConfig.jsx
 * and exits with a non-zero code if any required routes are missing or incorrect.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routeConfigPath = path.join(__dirname, '..', 'src', 'routes', 'routeConfig.jsx');

// Required routes based on the specification
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

// Required components for each route
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

// Required roles for specific routes
const requiredRoles = {
  '/admin': 'admin',
  '/invite-tenant': 'landlord',
  '/join-property': 'tenant',
  '/landlord-onboarding': 'landlord',
  '/tenant-onboarding': 'tenant'
};

// Try to read the route config file
try {
  const fileContent = fs.readFileSync(routeConfigPath, 'utf8');
  
  // Extract the routeConfig array using regex
  const routeConfigMatch = fileContent.match(/const\s+routeConfig\s*=\s*\[([\s\S]*?)\];/);
  if (!routeConfigMatch) {
    console.error(chalk.red('❌ Could not find routeConfig array in the file'));
    process.exit(1);
  }
  
  const routeConfigStr = routeConfigMatch[1];
  
  // Parse the routes from the string
  const routeObjects = [];
  
  // Regular expression to match each route object
  const routeObjectRegex = /{([^}]+)}/g;
  let routeMatch;
  
  while (routeMatch = routeObjectRegex.exec(routeConfigStr)) {
    const routeObjectStr = routeMatch[1];
    
    // Extract path
    const pathMatch = routeObjectStr.match(/path:\s*['"]([^'"]*)['"]/);
    const path = pathMatch ? pathMatch[1] : null;
    
    // Extract component
    const componentMatch = routeObjectStr.match(/component:\s*['"]([^'"]*)['"]/);
    const component = componentMatch ? componentMatch[1] : null;
    
    // Extract role if it exists
    const roleMatch = routeObjectStr.match(/role:\s*['"]([^'"]*)['"]/);
    const role = roleMatch ? roleMatch[1] : null;
    
    if (path && component) {
      routeObjects.push({ path, component, role });
    }
  }
  
  // Check for missing routes
  const missingRoutes = requiredRoutes.filter(route => 
    !routeObjects.some(extracted => extracted.path === route)
  );
  
  // Check for incorrect components
  const incorrectComponents = routeObjects.filter(route => 
    requiredComponents[route.path] && route.component !== requiredComponents[route.path]
  );
  
  // Check for incorrect roles
  const incorrectRoles = routeObjects.filter(route => 
    requiredRoles[route.path] && route.role !== requiredRoles[route.path]
  );
  
  // Report findings
  if (missingRoutes.length > 0 || incorrectComponents.length > 0 || incorrectRoles.length > 0) {
    console.error(chalk.red('❌ Route configuration validation failed'));
    
    if (missingRoutes.length > 0) {
      console.error(chalk.red('\nMissing routes:'));
      missingRoutes.forEach(route => {
        console.error(chalk.red(`  - ${route}`));
      });
    }
    
    if (incorrectComponents.length > 0) {
      console.error(chalk.red('\nIncorrect components:'));
      incorrectComponents.forEach(route => {
        console.error(chalk.red(`  - ${route.path}: found "${route.component}", expected "${requiredComponents[route.path]}"`));
      });
    }
    
    if (incorrectRoles.length > 0) {
      console.error(chalk.red('\nIncorrect roles:'));
      incorrectRoles.forEach(route => {
        console.error(chalk.red(`  - ${route.path}: found "${route.role || 'none'}", expected "${requiredRoles[route.path]}"`));
      });
    }
    
    process.exit(1);
  } else {
    // Sort routes for display
    const sortedRoutes = [...routeObjects].sort((a, b) => a.path.localeCompare(b.path));
    
    console.log(chalk.green('✅ All routes are correctly configured!\n'));
    console.log(chalk.bold('Route configuration:'));
    
    // Display table header
    console.log(chalk.dim('--------------------------------------------------------------'));
    console.log(chalk.bold('Path                  | Component           | Guard/Role'));
    console.log(chalk.dim('--------------------------------------------------------------'));
    
    // Display table rows
    sortedRoutes.forEach(route => {
      const paddedPath = route.path.padEnd(22);
      const paddedComponent = route.component.padEnd(20);
      const roleInfo = route.role ? chalk.yellow(`role: ${route.role}`) : '';
      console.log(`${paddedPath}| ${paddedComponent}| ${roleInfo}`);
    });
    
    console.log(chalk.dim('--------------------------------------------------------------'));
    console.log(`Total: ${sortedRoutes.length} routes\n`);
    
    process.exit(0);
  }
  
} catch (error) {
  console.error(chalk.red(`❌ Error: ${error.message}`));
  process.exit(1);
}
