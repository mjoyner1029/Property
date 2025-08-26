#!/usr/bin/env node
/**
 * Automated Accessibility Testing Script
 * 
 * This script launches a local server and runs accessibility tests
 * against the key pages of the application.
 * 
 * Usage: npm run test:a11y
 */

const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const express = require('express');
const path = require('path');
const http = require('http');
const chalk = require('chalk');
const fs = require('fs');

// Configuration
const BUILD_DIR = path.join(__dirname, '..', 'build');
const PORT = 9000;
const REPORT_DIR = path.join(__dirname, '..', 'a11y-reports');
const PAGES_TO_TEST = [
  '/',
  '/login',
  '/signup',
  '/dashboard',
  '/settings',
  '/profile',
  '/about',
];

// Ensure report directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

console.log(chalk.blue('🧪 Starting accessibility testing...'));

// Start a local server for testing
const app = express();
app.use(express.static(BUILD_DIR));
app.get('*', (_req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

const server = http.createServer(app);

server.listen(PORT, async () => {
  console.log(chalk.green(`Server started on http://localhost:${PORT}`));
  
  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Summary data
  const summary = {
    totalViolations: 0,
    testedPages: 0,
    passedPages: 0,
    violationsByType: {},
    violationsByImpact: {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    },
  };
  
  // Full report data
  const fullReport = {
    timestamp: new Date().toISOString(),
    pages: {},
  };
  
  // Test each page
  for (const pagePath of PAGES_TO_TEST) {
    const url = `http://localhost:${PORT}${pagePath}`;
    console.log(chalk.blue(`Testing page: ${pagePath}`));
    
    try {
      // Navigate and wait for page to be ready
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000); // Give React time to render
      
      // Run axe analysis
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      // Store results
      fullReport.pages[pagePath] = accessibilityScanResults;
      
      // Update summary
      summary.testedPages++;
      const violations = accessibilityScanResults.violations;
      
      if (violations.length === 0) {
        summary.passedPages++;
        console.log(chalk.green(`  ✅ No accessibility violations found on ${pagePath}`));
      } else {
        console.log(chalk.yellow(`  ⚠️ Found ${violations.length} accessibility violations on ${pagePath}`));
        
        // Track violations by type and impact
        violations.forEach(violation => {
          summary.totalViolations += violation.nodes.length;
          
          // Count by violation type
          if (!summary.violationsByType[violation.id]) {
            summary.violationsByType[violation.id] = 0;
          }
          summary.violationsByType[violation.id] += violation.nodes.length;
          
          // Count by impact level
          if (summary.violationsByImpact[violation.impact]) {
            summary.violationsByImpact[violation.impact] += violation.nodes.length;
          }
          
          // Log the violations
          console.log(chalk.yellow(`    - ${violation.id}: ${violation.help} (${violation.impact})`));
          console.log(chalk.gray(`      ${violation.helpUrl}`));
        });
      }
    } catch (error) {
      console.error(chalk.red(`  ❌ Error testing ${pagePath}: ${error.message}`));
      fullReport.pages[pagePath] = { error: error.message };
    }
  }
  
  // Save the full report
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(REPORT_DIR, `a11y-report-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));
  
  // Display summary
  console.log('\n' + chalk.blue('📊 Accessibility Test Summary:'));
  console.log(chalk.white(`Pages tested: ${summary.testedPages}`));
  console.log(chalk.white(`Pages with no violations: ${summary.passedPages}`));
  console.log(chalk.white(`Total violations: ${summary.totalViolations}`));
  
  console.log('\n' + chalk.blue('Violations by impact:'));
  Object.entries(summary.violationsByImpact).forEach(([impact, count]) => {
    if (count > 0) {
      const color = 
        impact === 'critical' ? chalk.red :
        impact === 'serious' ? chalk.magenta :
        impact === 'moderate' ? chalk.yellow :
        chalk.white;
      
      console.log(color(`  ${impact}: ${count}`));
    }
  });
  
  console.log('\n' + chalk.blue('Top violations:'));
  const sortedViolations = Object.entries(summary.violationsByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  sortedViolations.forEach(([id, count]) => {
    console.log(chalk.yellow(`  ${id}: ${count}`));
  });
  
  console.log('\n' + chalk.green(`Full report saved to: ${reportPath}`));
  
  // Close browser and server
  await browser.close();
  server.close();
  
  // Exit with error code if violations found
  if (summary.totalViolations > 0) {
    console.log(chalk.yellow('\n⚠️ Accessibility issues found. Please fix them before deployment.'));
    process.exit(1);
  } else {
    console.log(chalk.green('\n✅ All accessibility tests passed!'));
    process.exit(0);
  }
});

// Handle server errors
server.on('error', (err) => {
  console.error(chalk.red(`Server error: ${err.message}`));
  process.exit(1);
});
