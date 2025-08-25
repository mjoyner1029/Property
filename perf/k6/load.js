import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// ---- Config ----
const BASE_URL = __ENV.K6_BASE_URL || __ENV.API_URL || 'http://localhost:5050';
const USERNAME = __ENV.K6_USERNAME || __ENV.USERNAME;
const PASSWORD = __ENV.K6_PASSWORD || __ENV.PASSWORD;
const TEST_TYPE = 'load';

if (/prod|production|api\.assetanchor\.io/i.test(BASE_URL) && __ENV.ALLOW_PROD !== '1') {
  throw new Error(`Refusing to hit probable production host: ${BASE_URL}. Set ALLOW_PROD=1 to override.`);
}

export const errorRate = new Rate('errors');

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

export function handleSummary(data) {
  const html = htmlReport(data);
  return {
    'k6-summary.json': JSON.stringify(data, null, 2),
    'k6-summary.html': html,
  };
}

export const options = {
  stages: [
    { duration: __ENV.K6_RAMP_UP || '2m', target: Number(__ENV.K6_TARGET_VUS || 50) },
    { duration: __ENV.K6_PEAK || '5m', target: Number(__ENV.K6_TARGET_VUS || 50) },
    { duration: __ENV.K6_RAMP_DOWN || '2m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800', 'p(99)<1200'],
    errors: ['rate<0.02'],
  },
  tags: { test_type: 'load' },
  summaryTrendStats: ['min','avg','med','p(90)','p(95)','p(99)','max'],
};

export default function () {
  const token = getAuthToken();
  const headers = Object.assign({ 'Content-Type': 'application/json' }, authHeaders(token));

  group('Public endpoints', () => {
    const res1 = http.get(`${BASE_URL}/api/properties/public`, { tags: { endpoint: 'properties_public', test_type: 'load' } });
    check(res1, { 'properties_public 200': (r) => r.status === 200 }) || errorRate.add(1);

    const res2 = http.get(`${BASE_URL}/api/health`, { tags: { endpoint: 'health', test_type: 'load' } });
    check(res2, { 'health 200': (r) => r.status === 200 }) || errorRate.add(1);
  });

  if (token) {
    group('Authed CRUD-ish flow', () => {
      const invoices = http.get(`${BASE_URL}/api/invoices`, { headers, tags: { endpoint: 'invoices_list', test_type: 'load' } });
      check(invoices, { 'invoices 200': (r) => r.status === 200 }) || errorRate.add(1);

      const payload = JSON.stringify({ title: `note-${randomString(6)}`, body: 'perf note' });
      const create = http.post(`${BASE_URL}/api/notes`, payload, { headers, tags: { endpoint: 'notes_create', test_type: 'load' } });
      check(create, { 'notes create 2xx': (r) => r.status >= 200 && r.status < 300 }) || errorRate.add(1);
      try {
        const id = create.json().id;
        if (id) {
          const del = http.del(`${BASE_URL}/api/notes/${id}`, null, { headers, tags: { endpoint: 'notes_delete', test_type: 'load' } });
          check(del, { 'notes delete 2xx': (r) => r.status >= 200 && r.status < 300 }) || errorRate.add(1);
        }
      } catch {
        errorRate.add(1);
      }
    });
  }
  sleep(1);
}
