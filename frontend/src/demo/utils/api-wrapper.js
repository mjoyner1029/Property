// Demo mode wrapper around the real api.js
import originalApi, { backendUrl } from '../../utils/api';

// Determine if we're in demo mode
const isDemoMode = process.env.REACT_APP_DEMO_MODE === '1';

// In demo mode, we need to override the api instance to work with MSW
const api = isDemoMode ? 
  // Use modified version for demo mode
  (() => {
    // Create a clone of the original api
    const demoApi = { ...originalApi };
    
    // In demo mode, we need to make sure axios properly intercepts all requests
    // even when they're made directly through fetch
    // This is just a safety check in case any part of the app uses fetch directly
    
    // Override the original fetch to ensure proper integration with MSW in demo mode
    const originalFetch = window.fetch;
    window.fetch = async (resource, init = {}) => {
      // If this is an API request, make sure to use the right URL format
      if (typeof resource === 'string' && resource.startsWith('/api')) {
        // Demo mode already intercepts with MSW, so just use the original fetch
        return originalFetch(resource, init);
      }
      
      // Pass through to original fetch for non-API requests
      return originalFetch(resource, init);
    };
    
    return demoApi;
  })()
  :
  // Use original api for production
  originalApi;

// Re-export the backendUrl and the api instance
export { backendUrl };
export default api;
