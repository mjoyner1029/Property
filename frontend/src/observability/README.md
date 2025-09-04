# Sentry Integration for Frontend Error Tracking

## Overview

This directory contains the configuration for Sentry, a tool for error tracking and performance monitoring in the frontend application. The integration is designed to be lightweight, configurable, and only active when explicitly enabled via environment variables.

## Features

- Error tracking with comprehensive context
- Basic performance monitoring with BrowserTracing
- User context tracking
- Environment-specific configuration
- Automatic error reporting via ErrorBoundary
- Manual error reporting via API
- Test tools for verifying integration

## Configuration

Sentry is only initialized when the `REACT_APP_SENTRY_DSN` environment variable is set. This ensures that error tracking is only active when explicitly enabled, and won't affect local development or testing environments unless desired.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_SENTRY_DSN` | Sentry Data Source Name (DSN) | `` (empty - Sentry disabled) |
| `REACT_APP_SENTRY_ENVIRONMENT` | Environment name (e.g., `production`, `staging`) | Value from `ENVIRONMENT` |
| `REACT_APP_SENTRY_SAMPLE_RATE` | Performance sampling rate (0.0-1.0) | `0.1` (10% of transactions) |
| `REACT_APP_ENABLE_SENTRY` | Force enable in non-production | `false` |

## Usage

### Automatic Error Reporting

The application includes an ErrorBoundary component that automatically captures unhandled errors in the React component tree and reports them to Sentry if configured.

```jsx
import { ErrorBoundary } from './components/ErrorBoundary';

// Wrap your component or route with ErrorBoundary
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

### Manual Error Reporting

You can manually report errors using the provided utility functions:

```jsx
import { captureException } from './observability/sentry';

try {
  // Your code that might fail
} catch (error) {
  captureException(error, {
    tags: { feature: 'checkout' },
    extra: { orderId: '123' }
  });
}
```

### User Context

Set user information to associate errors with specific users:

```jsx
import { setSentryUser, clearSentryUser } from './observability/sentry';

// After login
setSentryUser({
  id: 'user-123',
  email: 'user@example.com'
});

// After logout
clearSentryUser();
```

## Testing Sentry Integration

1. Set the `REACT_APP_SENTRY_DSN` environment variable to your Sentry project DSN
2. Use the `SentryDebug` component to generate test errors
3. Verify errors appear in your Sentry dashboard

## Notes

- Replay and ReactProfiler features are intentionally disabled for better compatibility with React 18+
- Performance monitoring uses a low sample rate (10%) to minimize overhead
- User information is scrubbed from URLs and sensitive requests to protect privacy
