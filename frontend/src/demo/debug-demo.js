// Debug script for demo mode
// Run this in browser console to diagnose issues

export const debugDemo = () => {
  console.log('========== DEMO MODE DEBUG ==========');
  
  // Check environment variable
  console.log('REACT_APP_DEMO_MODE:', process.env.REACT_APP_DEMO_MODE);
  
  // Check MSW status
  console.log('MSW Status:', window['mswWorker'] ? 'Active' : 'Not active');
  
  // Check localStorage items
  console.log('Demo DB exists:', Boolean(localStorage.getItem('demo_db')));
  console.log('Demo Auth Token exists:', Boolean(localStorage.getItem('demo_access_token')));
  console.log('Demo Refresh Token exists:', Boolean(localStorage.getItem('demo_refresh_token')));
  
  // Try to load demo data
  try {
    const db = JSON.parse(localStorage.getItem('demo_db') || '{}');
    console.log('Demo DB Structure:', Object.keys(db));
    console.log('Users count:', db.users ? db.users.length : 0);
    console.log('Properties count:', db.properties ? db.properties.length : 0);
    console.log('Units count:', db.units ? db.units.length : 0);
    console.log('Tenants count:', db.tenants ? db.tenants.length : 0);
  } catch (e) {
    console.error('Failed to parse demo_db:', e);
  }
  
  // Check for Auth tokens
  try {
    const token = localStorage.getItem('demo_access_token');
    if (token) {
      console.log('Token exists:', token.substring(0, 20) + '...');
      
      // Try to decode token
      if (window.jwtDecode) {
        const decoded = window.jwtDecode(token);
        console.log('Decoded token:', decoded);
        
        // Check if token is expired
        const now = Date.now() / 1000;
        console.log('Token expired:', decoded.exp < now);
        console.log('Expires in:', Math.round(decoded.exp - now), 'seconds');
      }
    } else {
      console.log('No auth token found');
    }
  } catch (e) {
    console.error('Failed to check token:', e);
  }
  
  // Check current route
  console.log('Current route:', window.location.pathname);
  
  // Check if any route guards are active
  const isProtectedRoute = ['/dashboard', '/properties', '/tenants', '/maintenance', '/payments'].some(
    route => window.location.pathname.startsWith(route)
  );
  console.log('Is protected route:', isProtectedRoute);
  
  // Collect API route information
  console.log('Starting API call monitoring - refresh page to stop');
  monitorApiCalls();
  
  console.log('=====================================');
  return 'Debug complete. Check console output. API calls will be logged in real-time.';
};

// Track API calls
let apiCalls = [];
const monitorApiCalls = () => {
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch
  window.fetch = async (...args) => {
    const [url] = args;
    if (typeof url === 'string' && url.includes('/api/')) {
      apiCalls.push({
        method: 'fetch',
        url,
        timestamp: new Date().toISOString()
      });
      console.log('🔍 [Demo Debug] API call:', url);
    }
    return originalFetch.apply(window, args);
  };
  
  // Return monitoring API
  return {
    getApiCalls: () => [...apiCalls],
    reset: () => { apiCalls = []; }
  };
};

// Get debug info in a structured format
export const getDebugInfo = () => {
  try {
    // Get auth state
    const accessToken = localStorage.getItem('demo_access_token');
    let decodedToken = null;
    let tokenExpired = false;
    let user = null;
    
    // Try to decode the token
    if (accessToken && window.jwtDecode) {
      try {
        decodedToken = window.jwtDecode(accessToken);
        const currentTime = Date.now() / 1000;
        tokenExpired = decodedToken.exp < currentTime;
        user = decodedToken.user;
      } catch (err) {
        console.error('Failed to decode token:', err);
      }
    }
    
    // Get DB state
    let db = null;
    try {
      db = JSON.parse(localStorage.getItem('demo_db') || '{}');
    } catch (err) {
      console.error('Failed to parse DB:', err);
    }
    
    return {
      isDemoMode: process.env.REACT_APP_DEMO_MODE === '1',
      auth: {
        isAuthenticated: !!accessToken && !tokenExpired,
        hasToken: !!accessToken,
        tokenExpired,
        user,
      },
      msw: {
        isActive: !!(window.mswWorker && window.mswWorker.active),
      },
      db: {
        exists: !!db,
        users: db?.users?.length || 0,
        properties: db?.properties?.length || 0,
        units: db?.units?.length || 0,
        tenants: db?.tenants?.length || 0,
      },
      apiCalls: apiCalls.slice(-10) // Show last 10 API calls
    };
  } catch (err) {
    return {
      error: err.message
    };
  }
};

// Expose to window for console access
window.debugDemo = debugDemo;

// Export for import usage
export default debugDemo;
