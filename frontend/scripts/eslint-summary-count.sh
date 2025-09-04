#!/bin/bash
cd "$(dirname "$0")/.."

echo "Running ESLint to count remaining errors..."
npx eslint src --quiet --format=json > eslint_results.json 2>/dev/null

echo "Processing ESLint results..."
node -e '
const fs = require("fs");
const results = JSON.parse(fs.readFileSync("eslint_results.json", "utf8"));

// Count total errors
let totalErrors = 0;
for (const result of results) {
  totalErrors += result.errorCount || 0;
}

// Group errors by rule
const errorsByRule = {};
for (const result of results) {
  if (result.messages && result.messages.length) {
    for (const msg of result.messages) {
      const rule = msg.ruleId || "unknown";
      errorsByRule[rule] = (errorsByRule[rule] || 0) + 1;
    }
  }
}

// Top 10 files with most errors
const fileErrors = results.map(r => ({
  filePath: r.filePath,
  errorCount: r.errorCount || 0
}))
.filter(f => f.errorCount > 0)
.sort((a, b) => b.errorCount - a.errorCount);

console.log(`\nTotal ESLint errors remaining: ${totalErrors}\n`);

console.log("Top rules with errors:");
const sortedRules = Object.entries(errorsByRule)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

for (const [rule, count] of sortedRules) {
  console.log(`${rule}: ${count} errors`);
}

console.log("\nTop files with errors:");
for (const file of fileErrors.slice(0, 10)) {
  console.log(`${file.filePath}: ${file.errorCount} errors`);
}

fs.unlinkSync("eslint_results.json");
'
