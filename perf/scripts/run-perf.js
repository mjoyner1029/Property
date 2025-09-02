#!/usr/bin/env node
/**
 * run-perf.js - Script to run performance tests and generate reports
 * 
 * Usage:
 *   node run-perf.js smoke|load [--baseline] [--update-baseline] [--api-url=URL]
 *
 * Examples:
 *   node run-perf.js smoke
 *   node run-perf.js load --api-url=https://api-staging.assetanchor.io
 *   node run-perf.js smoke --update-baseline
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse arguments
const args = process.argv.slice(2);
const testType = args[0];
const options = {
  baseline: args.includes('--baseline'),
  updateBaseline: args.includes('--update-baseline'),
  apiUrl: args.find(arg => arg.startsWith('--api-url='))?.split('=')[1] || 'http://localhost:5050'
};

// Validate test type
if (!['smoke', 'load'].includes(testType)) {
  console.error('Error: First argument must be either "smoke" or "load"');
  process.exit(1);
}

// Paths
const k6Dir = path.join(__dirname, '..', 'k6');
const baseLinesDir = path.join(__dirname, '..', 'baselines', testType);
const summaryPath = path.join(process.cwd(), 'k6-summary.json');
const baselinePath = path.join(baseLinesDir, 'k6-summary.json');

// Ensure baseline directory exists
if (!fs.existsSync(baseLinesDir)) {
  fs.mkdirSync(baseLinesDir, { recursive: true });
}

// Run the test
console.log(`Running ${testType} test against ${options.apiUrl}...`);
try {
  execSync(`cd ${k6Dir} && K6_BASE_URL=${options.apiUrl} k6 run ${testType}.js`, { 
    stdio: 'inherit' 
  });
  console.log('Test completed successfully.');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}

// Check if summary file was generated
if (!fs.existsSync(summaryPath)) {
  console.error('Error: No summary file was generated');
  process.exit(1);
}

// Update baseline if requested
if (options.updateBaseline) {
  console.log('Updating baseline...');
  fs.copyFileSync(summaryPath, baselinePath);
  console.log(`Baseline updated: ${baselinePath}`);
}

// Compare with baseline if requested
if (options.baseline && fs.existsSync(baselinePath)) {
  console.log('Comparing with baseline...');
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  
  // Compare p95 latency
  const currentP95 = summary.metrics.http_req_duration?.values?.p(95) || 0;
  const baselineP95 = baseline.metrics.http_req_duration?.values?.p(95) || 0;
  const diff = currentP95 - baselineP95;
  const diffPercent = ((diff / baselineP95) * 100).toFixed(2);
  
  console.log(`\nLatency Comparison (p95):`);
  console.log(`  Current:  ${currentP95.toFixed(2)}ms`);
  console.log(`  Baseline: ${baselineP95.toFixed(2)}ms`);
  console.log(`  Diff:     ${diff.toFixed(2)}ms (${diffPercent}%)`);
  
  // Error rate comparison
  const currentErrors = summary.metrics.http_req_failed?.values?.rate || 0;
  const baselineErrors = baseline.metrics.http_req_failed?.values?.rate || 0;
  console.log(`\nError Rate Comparison:`);
  console.log(`  Current:  ${(currentErrors * 100).toFixed(2)}%`);
  console.log(`  Baseline: ${(baselineErrors * 100).toFixed(2)}%`);
  
  // Set exit code based on regression threshold
  const REGRESSION_THRESHOLD_MS = 100; // 100ms is significant regression
  if (diff > REGRESSION_THRESHOLD_MS) {
    console.error(`\n⚠️  PERFORMANCE REGRESSION DETECTED: p95 latency increased by ${diff.toFixed(2)}ms`);
    process.exit(1);
  } else {
    console.log(`\n✅ No significant performance regression detected`);
  }
}

console.log(`\nReports available:`);
console.log(`- JSON: ${summaryPath}`);
console.log(`- HTML: ${summaryPath.replace('.json', '.html')}`);
