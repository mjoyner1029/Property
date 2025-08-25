// Usage: node compare-baseline.js <baseline.json> <current.json> <maxRegressionMs>
const fs = require('fs');
function p95FromSummary(summary) {
  try { return summary.metrics.http_req_duration.values['p(95)'] || summary.metrics.http_req_duration.values.p95; }
  catch { return null; }
}
const [,, basePath, currentPath, maxRegStr] = process.argv;
if (!basePath || !currentPath) {
  console.error('Usage: node compare-baseline.js <baseline.json> <current.json> <maxRegressionMs>');
  process.exit(2);
}
const maxReg = Number(maxRegStr || 100);
const base = JSON.parse(fs.readFileSync(basePath, 'utf8'));
const cur = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
const b = p95FromSummary(base);
const c = p95FromSummary(cur);
if (b == null || c == null) { console.error('Could not parse p95 from summaries'); process.exit(2); }
const delta = c - b;
console.log(`Baseline p95=${b}ms, Current p95=${c}ms, Delta=${delta}ms (max allowed ${maxReg}ms)`);
if (delta > maxReg) { console.error('Regression exceeds threshold'); process.exit(1); }
console.log('Within threshold');
