# API Client Documentation

## Overview

This folder contains the centralized API client for the Property application. The API client provides a unified interface for all API calls in the application and ensures consistency in how we handle:

- API base URL management
- Authentication and tokens
- Error handling and retries
- Logging

## Usage

### Basic Usage

```javascript
import api from '../api/api';

// Using the API client in a component
function MyComponent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Use the API client to fetch data
        const response = await api.properties.getAll();
        setData(response);
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ...
}
```

### Authentication

```javascript
// Login
const login = async (email, password) => {
  try {
    const response = await api.auth.login({ email, password });
    // Handle successful login
    return response;
  } catch (error) {
    // Handle login error
    throw error;
  }
};

// Get current user
const getCurrentUser = async () => {
  try {
    return await api.auth.getCurrentUser();
  } catch (error) {
    // Handle error or return null if not authenticated
    return null;
  }
};
```

### Working with Resources

```javascript
// Create a resource
const createProperty = async (propertyData) => {
  return await api.properties.create(propertyData);
};

// Get a resource by ID
const getProperty = async (propertyId) => {
  return await api.properties.getById(propertyId);
};

// Update a resource
const updateProperty = async (propertyId, propertyData) => {
  return await api.properties.update(propertyId, propertyData);
};

// Delete a resource
const deleteProperty = async (propertyId) => {
  return await api.properties.delete(propertyId);
};
```

### Using Custom Endpoints

```javascript
// For endpoints not covered by the standard methods
const customEndpoint = async () => {
  return await api.get('/custom/endpoint', { params: { key: 'value' } });
};

const postToCustomEndpoint = async (data) => {
  return await api.post('/custom/endpoint', data);
};
```

## Configuration

The API client uses the following environment variables:

- `REACT_APP_API_URL`: The base URL of the API (e.g., `http://localhost:5050/api`)

Set these in your `.env` file or in the build environment.

## Error Handling

All API requests are wrapped with error handling. When an error occurs:

1. Transient errors (network issues, 429, 502/503/504) are retried automatically
2. Authentication errors (401) trigger a token refresh when possible
3. Other errors are normalized and thrown with useful context

Example error handling:

```javascript
try {
  await api.properties.getAll();
} catch (error) {
  console.error(`Status: ${error.status}, Message: ${error.message}`);
  
  if (error.status === 401) {
    // Handle authentication error
  } else if (error.status === 403) {
    // Handle permission error
  } else {
    // Handle other errors
  }
}
```

## Available API Methods

### Authentication
- `api.auth.login(credentials)`
- `api.auth.register(userData)`
- `api.auth.refreshToken()`
- `api.auth.verifyEmail(token)`
- `api.auth.forgotPassword(email)`
- `api.auth.resetPassword(token, password)`
- `api.auth.logout()`
- `api.auth.getCurrentUser()`
- `api.auth.validateResetToken(token)`

### Properties
- `api.properties.getAll()`
- `api.properties.getById(propertyId)`
- `api.properties.create(propertyData)`
- `api.properties.update(propertyId, propertyData)`
- `api.properties.delete(propertyId)`

### Maintenance
- `api.maintenance.getAll()`
- `api.maintenance.getById(requestId)`
- `api.maintenance.create(requestData)`
- `api.maintenance.update(requestId, requestData)`
- `api.maintenance.delete(requestId)`
- `api.maintenance.addComment(requestId, commentData)`

### Notifications
- `api.notifications.getAll()`
- `api.notifications.markAsRead(notificationId)`
- `api.notifications.markAllAsRead()`
- `api.notifications.delete(notificationId)`

### Tenants
- `api.tenants.getAll()`
- `api.tenants.getById(tenantId)`
- `api.tenants.create(tenantData)`
- `api.tenants.update(tenantId, tenantData)`
- `api.tenants.delete(tenantId)`
- `api.tenants.invite(inviteData)`
- `api.tenants.completeOnboarding(onboardingData)`

### Payments
- `api.payments.getAll()`
- `api.payments.getById(paymentId)`
- `api.payments.create(paymentData)`
- `api.payments.update(paymentId, paymentData)`
- `api.payments.delete(paymentId)`

### Messages
- `api.messages.getAll()`
- `api.messages.getThread(threadId)`
- `api.messages.getRecipients()`
- `api.messages.create(messageData)`
- `api.messages.reply(threadId, messageData)`
- `api.messages.markAsRead(threadId)`

### Error Logging
- `api.logging.logFrontendError(errorData)`

### Health Checks
- `api.health.check()`
- `api.health.ready()`
