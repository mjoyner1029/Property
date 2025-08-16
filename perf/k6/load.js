import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Define custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Ramp-up to 50 VUs over 2 minutes
    { duration: '3m', target: 50 },    // Stay at 50 VUs for 3 minutes (peak load)
    { duration: '1m', target: 0 },     // Ramp-down to 0 VUs over 1 minute
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'errors': ['rate<0.01'],           // Less than 1% error rate
    'http_req_duration{endpoint:health}': ['p(99)<200'], // Health checks should be fast
    'http_req_duration{endpoint:properties}': ['p(95)<600'], // Property listings may be heavier
    'http_req_duration{endpoint:auth}': ['p(95)<700'], // Auth operations can take longer
  },
};

// Base URL from environment variable or default
const BASE_URL = __ENV.API_URL || 'http://localhost:5050';

// Load test simulating realistic user flows
export default function() {
  // Test registration and authentication flow
  group('Authentication Flow', function() {
    // Unique email for this test run
    const testEmail = `test_${randomString(8)}@example.com`;
    
    // 1. Register a new user
    const registerPayload = JSON.stringify({
      name: 'Test User',
      email: testEmail,
      password: 'Password123!',
      role: 'tenant'
    });
    
    const registerHeaders = { 
      'Content-Type': 'application/json',
      'X-Test-Mode': 'true' // Special header to indicate test mode if your API supports it
    };
    
    const registerRes = http.post(
      `${BASE_URL}/api/auth/register`, 
      registerPayload, 
      { headers: registerHeaders, tags: { endpoint: 'auth' } }
    );
    
    check(registerRes, {
      'register status is 201': (r) => r.status === 201,
    }) || errorRate.add(1);
    
    // 2. Login with created user
    if (registerRes.status === 201) {
      const loginPayload = JSON.stringify({
        email: testEmail,
        password: 'Password123!'
      });
      
      const loginRes = http.post(
        `${BASE_URL}/api/auth/login`, 
        loginPayload,
        { headers: registerHeaders, tags: { endpoint: 'auth' } }
      );
      
      check(loginRes, {
        'login status is 200': (r) => r.status === 200,
        'login returns token': (r) => r.json().hasOwnProperty('access_token'),
      }) || errorRate.add(1);
      
      // 3. Use token for authenticated requests
      if (loginRes.status === 200) {
        const token = loginRes.json().access_token;
        const authHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Test-Mode': 'true'
        };
        
        // 4. Get user profile
        const profileRes = http.get(
          `${BASE_URL}/api/users/me`,
          { headers: authHeaders, tags: { endpoint: 'users' } }
        );
        
        check(profileRes, {
          'profile status is 200': (r) => r.status === 200,
          'profile contains user data': (r) => r.json().hasOwnProperty('email'),
        }) || errorRate.add(1);
      }
    }
  });
  
  // Public endpoint tests
  group('Public Endpoints', function() {
    // Health check
    const healthRes = http.get(
      `${BASE_URL}/api/health`, 
      { tags: { endpoint: 'health' } }
    );
    
    check(healthRes, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 200ms': (r) => r.timings.duration < 200,
    }) || errorRate.add(1);
    
    // Property listings
    const propertiesRes = http.get(
      `${BASE_URL}/api/properties/public`, 
      { tags: { endpoint: 'properties' } }
    );
    
    check(propertiesRes, {
      'properties status is 200': (r) => r.status === 200,
      'properties returns array': (r) => Array.isArray(r.json()),
    }) || errorRate.add(1);
  });
  
  // Sleep between iterations to simulate realistic user behavior
  sleep(Math.random() * 3 + 1);
}
