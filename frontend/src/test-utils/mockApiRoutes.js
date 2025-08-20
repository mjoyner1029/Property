// frontend/src/test-utils/mockApiRoutes.js
import axios from 'axios';

/**
 * Configure axios mock for successful authentication flow
 */
export function primeAuthSuccess() {
  axios.post.mockImplementation((url) => {
    if (url.includes('/api/auth/login')) {
      return Promise.resolve({ 
        data: { 
          access_token: 'test-token', 
          refresh_token: 'test-refresh-token',
          user: { id: 1, email: 'test@aa.io', roles: ['tenant'] } 
        } 
      });
    }
    if (url.includes('/api/auth/logout')) {
      return Promise.resolve({ status: 204, data: {} });
    }
    return Promise.resolve({ data: {} });
  });
  
  axios.get.mockImplementation((url) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({ 
        data: { id: 1, email: 'test@aa.io', roles: ['tenant'] } 
      });
    }
    if (url.includes('/api/auth/verify')) {
      return Promise.resolve({ data: { valid: true } });
    }
    return Promise.resolve({ data: {} });
  });
}

/**
 * Configure axios mock for admin user authentication
 */
export function primeAdminAuthSuccess() {
  axios.post.mockImplementation((url) => {
    if (url.includes('/api/auth/login')) {
      return Promise.resolve({ 
        data: { 
          access_token: 'admin-token', 
          refresh_token: 'admin-refresh-token',
          user: { id: 1, email: 'admin@aa.io', roles: ['admin'] } 
        } 
      });
    }
    if (url.includes('/api/auth/logout')) {
      return Promise.resolve({ status: 204, data: {} });
    }
    return Promise.resolve({ data: {} });
  });
  
  axios.get.mockImplementation((url) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({ 
        data: { id: 1, email: 'admin@aa.io', roles: ['admin'] } 
      });
    }
    if (url.includes('/api/auth/verify')) {
      return Promise.resolve({ data: { valid: true } });
    }
    return Promise.resolve({ data: {} });
  });
}

/**
 * Configure axios mock for properties endpoints
 */
export function primePropertiesSuccess(properties = []) {
  axios.get.mockImplementation((url) => {
    if (url.includes('/api/properties')) {
      if (url.match(/\/api\/properties\/\d+$/)) {
        const id = parseInt(url.split('/').pop());
        const property = properties.find(p => p.id === id) || {
          id,
          name: `Property ${id}`,
          address: '123 Test St',
          units: 5,
          createdAt: '2023-01-01T00:00:00Z'
        };
        return Promise.resolve({ data: property });
      }
      return Promise.resolve({ data: properties });
    }
    return Promise.resolve({ data: {} });
  });
}

/**
 * Configure axios mock for tenant endpoints
 */
export function primeTenantsSuccess(tenants = []) {
  axios.get.mockImplementation((url) => {
    if (url.includes('/api/tenants')) {
      if (url.match(/\/api\/tenants\/\d+$/)) {
        const id = parseInt(url.split('/').pop());
        const tenant = tenants.find(t => t.id === id) || {
          id,
          name: `Tenant ${id}`,
          email: `tenant${id}@example.com`,
          phone: '555-123-4567',
          createdAt: '2023-01-01T00:00:00Z'
        };
        return Promise.resolve({ data: tenant });
      }
      return Promise.resolve({ data: tenants });
    }
    return Promise.resolve({ data: {} });
  });
}

/**
 * Configure axios mock for maintenance endpoints
 */
export function primeMaintenanceSuccess(requests = []) {
  axios.get.mockImplementation((url) => {
    if (url.includes('/api/maintenance')) {
      if (url.match(/\/api\/maintenance\/\d+$/)) {
        const id = parseInt(url.split('/').pop());
        const request = requests.find(r => r.id === id) || {
          id,
          title: `Request ${id}`,
          description: 'Test maintenance request',
          status: 'open',
          priority: 'medium',
          createdAt: '2023-01-01T00:00:00Z'
        };
        return Promise.resolve({ data: request });
      }
      return Promise.resolve({ data: requests });
    }
    return Promise.resolve({ data: {} });
  });
}

/**
 * Configure axios mock for payment endpoints
 */
export function primePaymentsSuccess(payments = []) {
  axios.get.mockImplementation((url) => {
    if (url.includes('/api/payments')) {
      if (url.match(/\/api\/payments\/\d+$/)) {
        const id = parseInt(url.split('/').pop());
        const payment = payments.find(p => p.id === id) || {
          id,
          amount: 1000,
          status: 'paid',
          description: 'Rent payment',
          createdAt: '2023-01-01T00:00:00Z'
        };
        return Promise.resolve({ data: payment });
      }
      return Promise.resolve({ data: payments });
    }
    
    if (url.includes('/api/checkout')) {
      return Promise.resolve({ 
        data: { url: 'https://example.com/checkout' } 
      });
    }
    
    return Promise.resolve({ data: {} });
  });
}

/**
 * Reset all axios mocks to clean state
 */
export function resetAxios() { 
  axios.get.mockReset(); 
  axios.post.mockReset(); 
  axios.put.mockReset(); 
  axios.delete.mockReset(); 
  axios.patch.mockReset(); 
}
