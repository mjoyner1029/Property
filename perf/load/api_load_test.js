import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { URLSearchParams } from 'https://jslib.k6.io/url/1.0.0/index.js';

// Custom metrics
const failRate = new Rate('failed_requests');
const propertiesLatency = new Trend('properties_latency');
const tenantsLatency = new Trend('tenants_latency');
const paymentsLatency = new Trend('payments_history_latency');

// Default options
export let options = {
  // Base performance test configuration
  vus: 10,              // Number of virtual users
  duration: '60s',      // Test duration
  thresholds: {
    'http_req_duration': ['p95<300'],    // 95% of requests must complete below 300ms
    'failed_requests': ['rate<0.01'],    // Error rate must be less than 1%
    'properties_latency': ['p95<300'],   // 95% of /api/properties requests under 300ms
    'tenants_latency': ['p95<300'],      // 95% of /api/tenants requests under 300ms
    'payments_history_latency': ['p95<300'] // 95% of /api/payments/history requests under 300ms
  },
};

// Environment variables with defaults
const API_BASE_URL = __ENV.API_BASE_URL || 'https://staging-api.example.com';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'replace_with_your_auth_token';

// Headers
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
};

// Optional query params
const propertyQueryParams = new URLSearchParams({
  limit: '20',
  offset: '0'
});

const tenantQueryParams = new URLSearchParams({
  limit: '20',
  offset: '0',
  active: 'true'
});

const paymentsQueryParams = new URLSearchParams({
  limit: '10',
  offset: '0',
  days: '30'
});

export default function() {
  // Test endpoint 1: Properties
  let propertiesStartTime = new Date();
  let propertiesRes = http.get(
    `${API_BASE_URL}/api/properties?${propertyQueryParams.toString()}`, 
    { headers }
  );
  propertiesLatency.add(new Date() - propertiesStartTime);
  
  check(propertiesRes, {
    'properties status is 200': (r) => r.status === 200,
    'properties response has properties array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.properties);
      } catch (e) {
        return false;
      }
    }
  }) || failRate.add(1);

  sleep(1);

  // Test endpoint 2: Tenants
  let tenantsStartTime = new Date();
  let tenantsRes = http.get(
    `${API_BASE_URL}/api/tenants?${tenantQueryParams.toString()}`,
    { headers }
  );
  tenantsLatency.add(new Date() - tenantsStartTime);
  
  check(tenantsRes, {
    'tenants status is 200': (r) => r.status === 200,
    'tenants response has tenants array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.tenants);
      } catch (e) {
        return false;
      }
    }
  }) || failRate.add(1);

  sleep(1);

  // Test endpoint 3: Payments History
  let paymentsStartTime = new Date();
  let paymentsRes = http.get(
    `${API_BASE_URL}/api/payments/history?${paymentsQueryParams.toString()}`,
    { headers }
  );
  paymentsLatency.add(new Date() - paymentsStartTime);
  
  check(paymentsRes, {
    'payments status is 200': (r) => r.status === 200,
    'payments response has payments array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.payments);
      } catch (e) {
        return false;
      }
    }
  }) || failRate.add(1);

  sleep(1);
}


// To run different scenarios, use the K6 CLI:
// k6 run --vus 30 --duration 120s api_load_test.js   # High load
// k6 run --vus 20 --duration 60s api_load_test.js    # Moderate load
// k6 run --stages "30s:10,30s:50,30s:10,30s:0" api_load_test.js  # Spike test
