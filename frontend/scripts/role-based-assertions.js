#!/usr/bin/env node

/**
 * This script identifies test files using text-based queries (getByText) that could be
 * replaced with more semantic role-based assertions (getByRole, getByLabelText, etc.)
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Directory to search in
const searchDir = path.resolve(__dirname, '../src/__tests__');

// Function to recursively find all test files
function findTestFiles(dir) {
  const results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results.push(...findTestFiles(filePath));
    } else if (file.endsWith('.test.jsx') || file.endsWith('.test.js') || file.endsWith('.spec.jsx') || file.endsWith('.spec.js')) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Function to count occurrences in a file
function countOccurrences(filePath, pattern) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(new RegExp(pattern, 'g'));
  return matches ? matches.length : 0;
}

// Main function
async function main() {
  console.log('Analyzing test files for text vs. role-based queries...\n');
  
  const testFiles = findTestFiles(searchDir);
  const results = [];
  
  for (const file of testFiles) {
    const relativePath = path.relative(path.resolve(__dirname, '..'), file);
    const getByTextCount = countOccurrences(file, 'getByText\\(');
    const getByRoleCount = countOccurrences(file, 'getByRole\\(');
    const getByLabelTextCount = countOccurrences(file, 'getByLabelText\\(');
    const toMatchSnapshotCount = countOccurrences(file, 'toMatchSnapshot\\(');
    
    if (getByTextCount > 0 || toMatchSnapshotCount > 0) {
      results.push({
        file: relativePath,
        getByText: getByTextCount,
        getByRole: getByRoleCount,
        getByLabelText: getByLabelTextCount,
        toMatchSnapshot: toMatchSnapshotCount,
        roleRatio: (getByRoleCount + getByLabelTextCount) / (getByTextCount || 1)
      });
    }
  }
  
  // Sort by role ratio (lowest first, indicating text-heavy tests)
  results.sort((a, b) => a.roleRatio - b.roleRatio);
  
  console.log('Test files with text-based queries (sorted by most text-dependent first):');
  console.log('-----------------------------------------------------------------------');
  console.log('File | getByText | getByRole | getByLabelText | toMatchSnapshot | Role Ratio');
  console.log('-----|-----------|-----------|---------------|----------------|----------');
  
  for (const result of results) {
    console.log(`${result.file} | ${result.getByText} | ${result.getByRole} | ${result.getByLabelText} | ${result.toMatchSnapshot} | ${result.roleRatio.toFixed(2)}`);
  }
  
  console.log('\nRecommendation:');
  console.log('1. Start with files having the lowest role ratio (most text-dependent)');
  console.log('2. Replace getByText with getByRole, getByLabelText, or getByPlaceholderText where possible');
  console.log('3. Replace any toMatchSnapshot with specific assertions about component behavior');
}

main().catch(console.error);
