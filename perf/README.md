# Performance Test Stack (k6)

## Prereqs
- k6 v0.46+ (`brew install k6` or GitHub Actions runner step)
- API base URL, and optional credentials:
  - `K6_BASE_URL` (default: http://localhost:5050)
  - `K6_USERNAME`, `K6_PASSWORD` (optional; enables authed flows)

## Safety
By default, scripts refuse to hit production-like hosts. To override (not recommended), set `ALLOW_PROD=1`.

## Run
```bash
cd perf/k6
# Smoke
K6_BASE_URL=http://localhost:5050 k6 run smoke.js

# Load (staging)
K6_BASE_URL=https://api-staging.example.com K6_TARGET_VUS=50 k6 run load.js
```

## Outputs
Scripts write `k6-summary.json` and `k6-summary.html` via `handleSummary`. In CI, these are uploaded as artifacts.

## Thresholds
- Smoke: `p95<500ms`, errors `<2%`
- Load: `p95<800ms`, `p99<1200ms`, errors `<2%`

## Scenarios
- **Smoke**: quick correctness and basic latency.
- **Load**: sustained peak with public + optional authed CRUD flow.
- To add **stress/soak/spike**, copy `load.js` and adjust `options.stages`.

## Additional Scenario Templates

Use these as templates (copy into additional k6 scripts if you want them separately):

```javascript
// Stress (push beyond limits)
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 200 },   // push well past SLO
    { duration: '2m', target: 0 },
  ],
  thresholds: { http_req_failed: ['rate<0.05'], http_req_duration: ['p(99)<3000'] },
  tags: { test_type: 'stress' },
  summaryTrendStats: ['min','avg','med','p(90)','p(95)','p(99)','max'],
};

// Soak (long-running stability)
export const options = {
  stages: [
    { duration: '5m', target: 50 },
    { duration: '2h', target: 50 },    // soak
    { duration: '5m', target: 0 },
  ],
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<1000'] },
  tags: { test_type: 'soak' },
  summaryTrendStats: ['min','avg','med','p(90)','p(95)','p(99)','max'],
};

// Spike (sudden surge)
export const options = {
  stages: [
    { duration: '10s', target: 1 },
    { duration: '10s', target: 200 },  // instant spike
    { duration: '2m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: { http_req_failed: ['rate<0.02'], http_req_duration: ['p(95)<1500'] },
  tags: { test_type: 'spike' },
  summaryTrendStats: ['min','avg','med','p(90)','p(95)','p(99)','max'],
};
```

## CI Workflow

### Pull Requests
- k6-smoke runs, exports k6-summary.{json,html}
- Compares to baseline (perf/baselines/smoke/k6-summary.json) if available
- Fails on regression > 100ms p95

### Manual Triggers
- workflow_dispatch triggers k6-load-staging with staging credentials

### Artifacts
- Both jobs upload HTML/JSON summaries for review

## Baseline Comparison

Scripts write k6-summary.json and k6-summary.html which can be used for comparison.

### Using the Helper Script

The easiest way to run tests and manage baselines is with the helper script:

```bash
# Run a smoke test
node scripts/run-perf.js smoke

# Compare results with baseline
node scripts/run-perf.js smoke --baseline

# Update the baseline after a successful test
node scripts/run-perf.js smoke --update-baseline

# Target a specific API URL
node scripts/run-perf.js smoke --api-url=https://api-staging.assetanchor.io
```

### Manual Process

To establish a baseline manually:
1. Run a successful smoke/load test
2. Copy the k6-summary.json to perf/baselines/[smoke|load]/
3. Commit the baseline to the repository

Future tests will automatically compare against this baseline.

### Regression Detection

The helper script will automatically detect performance regressions by comparing:
- Response time p95 (fails if increases by more than 100ms)
- Error rates

You can adjust the regression thresholds in `scripts/run-perf.js`.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| K6_BASE_URL | API base URL | http://localhost:5050 |
| K6_USERNAME | Username for auth endpoints | (none) |
| K6_PASSWORD | Password for auth endpoints | (none) |
| K6_VUS | Virtual users for smoke tests | 5 |
| K6_DURATION | Duration for smoke tests | 30s |
| K6_TARGET_VUS | Target VUs for load tests | 50 |
| K6_RAMP_UP | Ramp-up duration | 2m |
| K6_PEAK | Peak load duration | 5m |
| K6_RAMP_DOWN | Ramp-down duration | 2m |
| ALLOW_PROD | Allow hitting production URLs (1=yes) | 0 |

## Security & Safety

- No hardcoded tokens/URLs: use K6_BASE_URL, K6_USERNAME, K6_PASSWORD
- Prod guard: if BASE_URL looks like prod, the run aborts unless ALLOW_PROD=1
- Redaction: k6 logs won't echo tokens (we keep them in headers only)
- Safe defaults: low VUs in smoke; load parameters controlled by env, not code
