import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// ---- Config ----
const BASE_URL = __ENV.K6_BASE_URL || __ENV.API_URL || 'http://localhost:5050';
const USERNAME = __ENV.K6_USERNAME || __ENV.USERNAME;
const PASSWORD = __ENV.K6_PASSWORD || __ENV.PASSWORD;
const TEST_TYPE = 'smoke';

// Guard: avoid accidental prod hits unless explicitly allowed
if (/prod|production|api\.assetanchor\.io/i.test(BASE_URL) && __ENV.ALLOW_PROD !== '1') {
  throw new Error(`Refusing to hit probable production host: ${BASE_URL}. Set ALLOW_PROD=1 to override.`);
}

// ---- Metrics ----
export const errorRate = new Rate('errors');

// ---- Auth helper (optional) ----
export function getAuthToken() {
  if (!USERNAME || !PASSWORD) return null;
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({ email: USERNAME, password: PASSWORD }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'auth_login', test_type: TEST_TYPE }
  });
  check(res, { 'login status is 200': (r) => r.status === 200 }) || errorRate.add(1);
  try {
    const token = res.json().access_token || res.json().token;
    if (!token) throw new Error('no token field');
    return token;
  } catch {
    errorRate.add(1);
    return null;
  }
}
export function authHeaders(token) { return token ? { Authorization: `Bearer ${token}` } : {}; }

// ---- Reporting ----
export function handleSummary(data) {
  const html = htmlReport(data);
  return {
    'k6-summary.json': JSON.stringify(data, null, 2),
    'k6-summary.html': html,
  };
}

export const options = {
  vus: Number(__ENV.K6_VUS || 5),
  duration: __ENV.K6_DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.02'],
  },
  tags: { test_type: 'smoke' },
  summaryTrendStats: ['min','avg','med','p(90)','p(95)','p(99)','max'],
};

export default function () {
  const token = getAuthToken(); // may be null
  // Lightweight GETs (public) + one optional authed call if token exists
  const endpoints = [
    { method: 'GET', url: `${BASE_URL}/api/health`, tags: { endpoint: 'health' } },
    { method: 'GET', url: `${BASE_URL}/api/properties/public`, tags: { endpoint: 'properties_public' } },
  ];
  for (const ep of endpoints) {
    const res = http.get(ep.url, { headers: authHeaders(token), tags: ep.tags });
    check(res, { [`${ep.tags.endpoint} status 200`]: (r) => r.status === 200 }) || errorRate.add(1);
  }
  sleep(1);
}
