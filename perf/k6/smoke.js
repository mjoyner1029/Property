import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Define custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp-up to 10 VUs over 30 seconds
    { duration: '1m', target: 10 },  // Stay at 10 VUs for 1 minute
    { duration: '30s', target: 0 },  // Ramp-down to 0 VUs over 30 seconds
  ],
  thresholds: {
    // Set thresholds for API response times (ms)
    'http_req_duration': ['p(95)<500'],  // 95% of requests should be below 500ms
    'errors': ['rate<0.01'],            // Less than 1% error rate
  },
};

// Base URL from environment variable or default
const BASE_URL = __ENV.API_URL || 'http://localhost:5050';

// Smoke test for critical API endpoints
export default function() {
  // 1. Health check
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  check(healthCheck, {
    'health check status is 200': (r) => r.status === 200,
    'health check returns ok': (r) => r.json().status === 'ok',
  }) || errorRate.add(1);
  
  // 2. Public endpoints
  const publicEndpoints = [
    `${BASE_URL}/api/status`,
    `${BASE_URL}/api/properties/public`,
  ];
  
  publicEndpoints.forEach(url => {
    const response = http.get(url);
    check(response, {
      [`${url} returns 200`]: (r) => r.status === 200,
      [`${url} response time < 500ms`]: (r) => r.timings.duration < 500,
    }) || errorRate.add(1);
  });
  
  // Small pause between iterations
  sleep(1);
}
