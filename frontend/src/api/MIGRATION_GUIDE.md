# API Client Migration Guide

This guide explains how to migrate from using direct `axios`, `fetch`, or other previous API approaches to the new centralized API client.

## Why Migrate?

The centralized API client offers several benefits:

1. **Single source of truth** for API base URL and authentication
2. **Consistent error handling** across all API calls
3. **Automatic token refresh** when authentication expires
4. **Retry logic** for transient errors
5. **Better organization** of API endpoints
6. **Type safety** with proper documentation

## Migration Steps

### Step 1: Import the API Client

Replace direct imports of `axios` or other HTTP clients with the centralized API client:

```javascript
// Before
import axios from 'axios';

// After
import api from '../api/api';
```

### Step 2: Replace Direct API Calls

Replace direct API calls with the appropriate methods from the API client:

#### Before:

```javascript
// Using axios directly
const fetchProperties = async () => {
  try {
    const response = await axios.get(`${API_URL}/properties`);
    return response.data;
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
};

const createProperty = async (propertyData) => {
  try {
    const response = await axios.post(`${API_URL}/properties`, propertyData);
    return response.data;
  } catch (error) {
    console.error('Error creating property:', error);
    throw error;
  }
};
```

#### After:

```javascript
// Using the centralized API client
const fetchProperties = async () => {
  try {
    return await api.properties.getAll();
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
};

const createProperty = async (propertyData) => {
  try {
    return await api.properties.create(propertyData);
  } catch (error) {
    console.error('Error creating property:', error);
    throw error;
  }
};
```

### Step 3: Update Authentication Logic

Replace direct authentication API calls:

#### Before:

```javascript
const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    localStorage.setItem('authToken', response.data.access_token);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

#### After:

```javascript
const login = async (credentials) => {
  try {
    // The API client handles token storage
    return await api.auth.login(credentials);
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

### Step 4: Update Error Handling

Take advantage of the consistent error format provided by the API client:

#### Before:

```javascript
try {
  const response = await axios.get(`${API_URL}/properties`);
  return response.data;
} catch (error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Server error:', error.response.data);
    throw new Error(error.response.data.message || 'Server error');
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Network error:', error.request);
    throw new Error('Network error');
  } else {
    // Something happened in setting up the request
    console.error('Request error:', error.message);
    throw error;
  }
}
```

#### After:

```javascript
try {
  return await api.properties.getAll();
} catch (error) {
  // Error is already normalized with status and message
  console.error(`Error ${error.status}: ${error.message}`);
  throw error;
}
```

### Step 5: Replace Custom Endpoints

For endpoints that don't fit into the predefined categories:

#### Before:

```javascript
const customEndpoint = async () => {
  const response = await axios.get(`${API_URL}/custom/endpoint`, {
    params: { key: 'value' }
  });
  return response.data;
};
```

#### After:

```javascript
const customEndpoint = async () => {
  return await api.get('/custom/endpoint', {
    params: { key: 'value' }
  });
};
```

## Examples of Common API Calls

### Authentication

```javascript
// Login
const user = await api.auth.login({ email, password });

// Register
const newUser = await api.auth.register({ email, password, name });

// Get current user
const currentUser = await api.auth.getCurrentUser();

// Logout
await api.auth.logout();
```

### Properties

```javascript
// Get all properties
const properties = await api.properties.getAll();

// Get a specific property
const property = await api.properties.getById(propertyId);

// Create a property
const newProperty = await api.properties.create({
  name: 'Beach House',
  address: '123 Ocean Drive'
});

// Update a property
const updatedProperty = await api.properties.update(propertyId, {
  name: 'Mountain Retreat'
});

// Delete a property
await api.properties.delete(propertyId);
```

### Maintenance

```javascript
// Get all maintenance requests
const requests = await api.maintenance.getAll();

// Create a maintenance request
const newRequest = await api.maintenance.create({
  propertyId: '123',
  title: 'Broken Faucet',
  description: 'The kitchen faucet is leaking'
});

// Add a comment to a request
await api.maintenance.addComment(requestId, {
  content: 'Plumber scheduled for tomorrow'
});
```

## Testing with the API Client

For unit tests, you can mock the API client:

```javascript
// Mock the API client
jest.mock('../api/api', () => ({
  properties: {
    getAll: jest.fn().mockResolvedValue([
      { id: '1', name: 'Test Property' }
    ]),
    getById: jest.fn().mockImplementation((id) => 
      Promise.resolve({ id, name: 'Test Property' })
    ),
    // Add other methods as needed
  },
  // Add other API groups as needed
}));
```

## Need Help?

If you encounter any issues during migration or have questions about how to use the API client for specific cases, please reach out to the development team.
