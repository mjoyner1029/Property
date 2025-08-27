#!/usr/bin/env node

/**
 * Automated Lighthouse performance testing script
 * This script runs Lighthouse performance tests against the Asset Anchor application
 * and reports the results, ensuring performance meets production standards.
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const { writeFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');
const chalk = require('chalk');

// URLs to test
const URLS_TO_TEST = [
  'http://localhost:3000',               // Homepage
  'http://localhost:3000/login',         // Login page
  'http://localhost:3000/register',      // Register page
  'http://localhost:3000/dashboard',     // Dashboard (requires auth)
  'http://localhost:3000/properties',    // Properties page (requires auth)
  'http://localhost:3000/payments',      // Payments page (requires auth)
  'http://localhost:3000/maintenance',   // Maintenance page (requires auth)
];

// Performance score thresholds
const THRESHOLDS = {
  performance: 85,
  accessibility: 90,
  'best-practices': 85,
  seo: 90,
};

// Output directory
const OUTPUT_DIR = join(__dirname, '../lighthouse-reports');

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Run Lighthouse audit for a URL
 */
async function runLighthouse(url, options = {}, config = null) {
  // Launch Chrome
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  // Set up options
  options.port = chrome.port;
  options.output = 'json';
  
  // Run Lighthouse
  const { lhr } = await lighthouse(url, options, config);
  
  // Close Chrome
  await chrome.kill();
  
  return lhr;
}

/**
 * Parse URL to create a filename
 */
function urlToFilename(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
}

/**
 * Run tests for all URLs
 */
async function runTests() {
  console.log(chalk.blue('Starting Lighthouse performance tests...\n'));
  
  const results = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  for (const url of URLS_TO_TEST) {
    try {
      console.log(chalk.yellow(`Testing ${url}...`));
      
      const lhr = await runLighthouse(url);
      
      // Extract scores
      const scores = {
        performance: Math.round(lhr.categories.performance.score * 100),
        accessibility: Math.round(lhr.categories.accessibility.score * 100),
        'best-practices': Math.round(lhr.categories['best-practices'].score * 100),
        seo: Math.round(lhr.categories.seo.score * 100),
      };
      
      // Check if scores meet thresholds
      const allPassed = Object.entries(THRESHOLDS).every(
        ([key, threshold]) => scores[key] >= threshold
      );
      
      // Add to results
      results.push({
        url,
        scores,
        passed: allPassed,
      });
      
      // Save full report
      const filename = `${urlToFilename(url)}-${timestamp}.json`;
      writeFileSync(join(OUTPUT_DIR, filename), JSON.stringify(lhr, null, 2));
      
      // Display scores
      console.log('Scores:');
      Object.entries(scores).forEach(([key, score]) => {
        const color = score >= THRESHOLDS[key] ? 'green' : 'red';
        console.log(
          chalk[color](
            `  ${key}: ${score} / ${THRESHOLDS[key]} ${score >= THRESHOLDS[key] ? '✓' : '✗'}`
          )
        );
      });
      console.log('\n');
      
    } catch (error) {
      console.error(chalk.red(`Error testing ${url}:`), error);
    }
  }
  
  // Generate summary
  console.log(chalk.blue('=== Performance Test Summary ==='));
  const passedCount = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  if (passedCount === totalTests) {
    console.log(chalk.green(`✓ All tests passed! (${passedCount}/${totalTests})`));
  } else {
    console.log(
      chalk.yellow(
        `${passedCount}/${totalTests} tests passed. Check detailed reports in ${OUTPUT_DIR}`
      )
    );
    
    // List failed tests
    const failed = results.filter(r => !r.passed);
    console.log(chalk.red('\nFailed tests:'));
    failed.forEach(result => {
      console.log(chalk.red(`- ${result.url}`));
      Object.entries(result.scores).forEach(([key, score]) => {
        if (score < THRESHOLDS[key]) {
          console.log(
            chalk.red(`  ${key}: ${score} / ${THRESHOLDS[key]}`)
          );
        }
      });
    });
    
    // Exit with error code if any tests failed
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(chalk.red('Error running performance tests:'), error);
  process.exit(1);
});
