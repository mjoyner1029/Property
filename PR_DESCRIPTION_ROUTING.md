# Routing and Navigation Improvements

## Summary
This PR enhances the application's routing and navigation structure by integrating previously created placeholder components into the route configuration and ensuring all pages are properly connected and traversable for end users.

## Changes
- **Route Configuration Updates**: 
  - Added routes for detail pages: `NotificationDetail`, `PaymentDetail`, `MessageDetail` 
  - Added routes for creation pages: `MessageCreate`, `TenantForm`
  - Ensured all placeholder components are properly configured with their respective routes

- **Navigation Flow Improvements**:
  - Updated `Notifications.jsx` to link individual notifications to their detail pages
  - Modified `Payments.jsx` to direct users to payment details when clicking on a payment record
  - Enhanced `Tenants.jsx` to link "Add Tenant" buttons to the new TenantForm page 
  - Added a "New" message button to the MessagesPage for creating new messages

- **Component Integration**:
  - Imported and registered all placeholder components in App.jsx
  - Added proper route definitions in routeConfig.jsx
  - Connected the UI components to their respective detail and creation pages

## Testing
- All routes are accessible through UI navigation elements
- All placeholders render correctly when navigated to
- Route guards are properly maintained for all new routes
- Navigation works correctly based on user roles

## Next Steps
- Implement the actual functionality for these placeholder components
- Add proper form validation for creation pages
- Enhance the UI for detail views with appropriate data loading
