# Demo Mode

This application supports a special "Demo Mode" that allows the UI to run without a backend server. This is useful for demonstrations, testing UI flows, and local development without needing to set up the backend.

## Features

- **Fully functional UI** - All UI components work as expected
- **No backend required** - All API calls are intercepted and served from in-memory data
- **Persistent data** - Data is stored in localStorage and persists between page reloads
- **Realistic latency and errors** - Configurable network conditions to simulate real-world scenarios
- **User role switching** - Easily switch between admin, landlord, and tenant roles
- **Debugging panel** - Interactive panel for controlling demo settings

## Getting Started

To start the application in Demo Mode:

```bash
npm run demo:start
```

To reset the demo data to its initial state:

```bash
npm run demo:reset
```

## Demo Panel

When running in Demo Mode, a panel will appear in the bottom-right corner of the screen. This panel allows you to:

- View the currently logged-in user
- Switch between different user roles (Admin, Landlord, Tenant)
- Adjust API response latency
- Configure random error rates
- Toggle force error mode and slow network simulation
- Reset all demo data

## Authentication

In Demo Mode, all users share the same password: `demo123`

The following demo users are available:

- **Admin**: admin@example.com
- **Landlord**: landlord@example.com
- **Tenant**: tenant@example.com

## Technical Details

Demo Mode uses the following technologies:

- [Mock Service Worker (MSW)](https://mswjs.io/) for intercepting API calls
- Browser's localStorage for data persistence
- React Context for demo state management

## Directory Structure

All Demo Mode code is isolated under `src/demo/` to avoid affecting the main application:

```
src/demo/
├── data/        # Demo data and persistence logic
├── mocks/       # MSW handlers and setup
├── providers/   # Demo context providers
├── ui/          # Demo-specific UI components
└── index.js     # Demo mode entry point and exports
```

## How It Works

1. When started with `REACT_APP_DEMO_MODE=1`, the app loads the demo entry point
2. MSW intercepts all API calls to `/api/*` endpoints
3. API handlers process requests against the in-memory database
4. Data changes are persisted to localStorage
5. The demo auth provider replaces the real auth provider

## Customization

You can modify the seed data in `src/demo/data/seed.js` to customize the initial state of the demo.

## Limitations

- Some advanced features that require backend-specific processing may not be fully functional
- File uploads are simulated but files aren't actually stored
- Email notifications and third-party integrations are mocked

## Development

When adding new API endpoints to the main application, make sure to add corresponding handlers in `src/demo/mocks/handlers.js` to ensure Demo Mode stays compatible.
