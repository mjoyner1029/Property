// This is a minimal test to verify the module imports correctly
// We're focusing on basic module import functionality rather than specific behavior

// Import the module directly instead of trying to mock axios
import api from '../../utils/api';

describe("api.js interceptors", () => {
  test("exports an axios instance", () => {
    // Check that the api module exports something valid
    expect(api).toBeDefined();
    
    // Check that it has standard axios methods
    expect(typeof api.get).toBe('function');
    expect(typeof api.post).toBe('function');
    expect(typeof api.put).toBe('function');
    expect(typeof api.delete).toBe('function');
    
    // Check that it has interceptors
    expect(api.interceptors).toBeDefined();
    expect(api.interceptors.request).toBeDefined();
    expect(api.interceptors.response).toBeDefined();
  });
});
