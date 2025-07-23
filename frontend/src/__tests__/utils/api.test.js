// Frontend test cases for API utility
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import api from '../../utils/api';

// Mock axios for testing
const mock = new MockAdapter(axios);

describe('API Utility', () => {
  // Reset mocks before each test
  beforeEach(() => {
    mock.reset();
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should add auth token to requests when available', async () => {
    // Setup: add token to localStorage
    localStorage.setItem('token', 'test-token');
    
    // Setup mock response
    mock.onGet('/api/test').reply(config => {
      // Check if token was added to request header
      expect(config.headers.Authorization).toBe('Bearer test-token');
      return [200, { success: true }];
    });
    
    // Execute
    await api.get('/api/test');
    
    // Validation is done in mock response
  });

  it('should handle 401 responses by redirecting to login', async () => {
    // Mock window.location
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };
    
    // Setup: add token to localStorage
    localStorage.setItem('token', 'expired-token');
    
    // Setup mock response
    mock.onGet('/api/test').reply(401, { error: 'Token expired' });
    
    // Execute and expect rejection
    await expect(api.get('/api/test')).rejects.toThrow();
    
    // Verify token was removed and redirect happened
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.href).toBe('/login?expired=true');
    
    // Restore window.location
    window.location = originalLocation;
  });

  it('should retry failed requests for server errors', async () => {
    // Setup mock to fail twice then succeed
    let attempts = 0;
    
    mock.onGet('/api/test-retry').reply(() => {
      attempts++;
      if (attempts <= 2) {
        return [500, { error: 'Server error' }];
      }
      return [200, { success: true }];
    });
    
    // Execute
    const response = await api.get('/api/test-retry');
    
    // Verify
    expect(attempts).toBe(3); // Two failures and one success
    expect(response.data).toEqual({ success: true });
  });

  it('should not retry non-GET requests', async () => {
    // Setup mock to always fail
    let attempts = 0;
    
    mock.onPost('/api/test-no-retry').reply(() => {
      attempts++;
      return [500, { error: 'Server error' }];
    });
    
    // Execute and expect rejection
    await expect(api.post('/api/test-no-retry')).rejects.toThrow();
    
    // Verify only one attempt was made
    expect(attempts).toBe(1);
  });
});
