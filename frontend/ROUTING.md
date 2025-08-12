# Routing Documentation

## Route Table

| Path                   | Component            | Guard/Role              |
|------------------------|----------------------|-------------------------|
| /                      | WelcomePage          | Public                  |
| /dashboard             | Dashboard            | Private                 |
| /overview              | Overview             | Private                 |
| /calendar              | Calendar             | Private                 |
| /properties            | Properties           | Private                 |
| /properties/new        | PropertyForm         | Private                 |
| /properties/:id        | PropertyDetail       | Private                 |
| /maintenance           | Maintenance          | Private                 |
| /maintenance/:id       | MaintenanceDetail    | Private                 |
| /tenants               | Tenants              | Private                 |
| /tenants/:id           | TenantDetail         | Private                 |
| /messages              | Messages             | Private                 |
| /messages/:threadId    | MessagesPage         | Private                 |
| /notifications         | Notifications        | Private                 |
| /payments              | Payments             | Private                 |
| /profile               | Profile              | Private                 |
| /settings              | Settings             | Private                 |
| /support               | Support              | Private                 |
| /terms                 | Terms                | Private                 |
| /activity              | ActivityFeed         | Private                 |
| /admin                 | AdminDashboard       | Role: admin             |
| /invite-tenant         | InviteTenant         | Role: landlord          |
| /join-property         | JoinProperty         | Role: tenant            |
| /landlord-onboarding   | LandlordOnboarding   | Role: landlord          |
| /tenant-onboarding     | TenantOnboarding     | Role: tenant            |
| /login                 | Login                | Public                  |
| /register              | Register             | Public                  |
| /forgot-password       | ForgotPassword       | Public                  |
| /reset-password        | ResetPassword        | Public                  |
| /verify-email          | VerifyEmail          | Public                  |
| /unauthorized          | Unauthorized         | Public                  |
| /dev/routes            | RoutesIndex          | Dev-only                |
| /*                     | NotFound             | Public                  |

## Route Guards

The application uses three types of route guards to control access to different pages:

### PublicRoute

Used for routes that should be accessible without authentication. If a user is already authenticated, they will be redirected to the dashboard.

```jsx
<PublicRoute>
  <Login />
</PublicRoute>
```

### PrivateRoute

Used for routes that require authentication. If a user is not authenticated, they will be redirected to the login page.

```jsx
<PrivateRoute>
  <Dashboard />
</PrivateRoute>
```

### RoleRoute

Used for routes that require specific roles. The component accepts either a `role` prop (string) or `roles` prop (array).

```jsx
<RoleRoute role="admin">
  <AdminDashboard />
</RoleRoute>

// Or with multiple roles:
<RoleRoute roles={['landlord', 'admin']}>
  <InviteTenant />
</RoleRoute>
```

## Role Claims Contract

The application expects the authenticated user object to have a `role` property that contains one of the following values:
- `admin`
- `landlord`
- `tenant`

This role is used by the `RoleRoute` guard to determine if a user has access to a specific route.

## Adding a New Route

To add a new route to the application:

1. Create a new component in the `src/pages` directory.
2. Add the route configuration to `src/routes/routeConfig.jsx`:

```jsx
{
  path: '/new-route',
  component: 'NewComponent', // Name of the component (must match the export name)
  guard: 'private', // One of: 'public', 'private', 'role', 'devOnly'
  role: 'admin', // Optional: Only required if guard is 'role'
  layout: true, // Whether to wrap the component in MainLayout
}
```

3. Import the component in `App.jsx` and add it to the `componentMap`:

```jsx
const NewComponent = React.lazy(() => import('./pages/NewComponent'));

// Add to componentMap
const componentMap = {
  // ... existing components
  NewComponent,
};
```

4. Run the verification script to ensure the route is configured correctly:

```bash
node scripts/verifyRoutes.mjs
```

## SPA Fallback

The application uses a SPA (Single Page Application) fallback to handle client-side routing. This is configured in `vercel.json` with the following rewrite rule:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

This ensures that all routes are handled by the React Router rather than resulting in 404 errors on the server.

## Lazy Loading

All page components are lazy loaded using `React.lazy()` to improve initial load performance. This means that the code for each page is only loaded when it's needed.

```jsx
const Component = React.lazy(() => import('./pages/Component'));
```

Each lazy-loaded component is wrapped in a `<Suspense>` component with a `<LoadingFallback>` to show a loading indicator while the component is being loaded:

```jsx
<Suspense fallback={<LoadingFallback />}>
  <Component />
</Suspense>
```
