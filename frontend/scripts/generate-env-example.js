#!/usr/bin/env node
/**
 * Environment Example Generator
 * 
 * This script scans source code for environment variable usage 
 * and generates or updates the .env.example file with those variables.
 * 
 * Usage: npm run generate:env
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const srcDir = path.join(__dirname, '..', 'src');
const envExampleFile = path.join(__dirname, '..', '.env.example');
const configFile = path.join(srcDir, 'config', 'environment.js');

console.log('Scanning source code for environment variable usage...');

// Read existing .env.example to preserve comments and structure if possible
let existingEnvExample = '';
try {
  existingEnvExample = fs.readFileSync(envExampleFile, 'utf8');
} catch (err) {
  console.log('No existing .env.example found, will create a new one.');
}

// Find all JS/JSX files
const files = glob.sync('**/*.{js,jsx}', { cwd: srcDir });

// Extract environment variables from getEnv calls in environment.js
const envVars = new Set();
let defaultValues = {};

try {
  const configContent = fs.readFileSync(configFile, 'utf8');
  
  // Extract all getEnv calls with their default values
  const getEnvRegex = /getEnv\(['"](.*?)['"],\s*(.*?)\)/g;
  let match;
  
  while ((match = getEnvRegex.exec(configContent)) !== null) {
    const varName = match[1];
    const defaultValue = match[2].trim();
    envVars.add(varName);
    defaultValues[varName] = defaultValue;
  }
  
  // Also look for direct process.env accesses
  const processEnvRegex = /process\.env\.([A-Z_0-9]+)/g;
  while ((match = processEnvRegex.exec(configContent)) !== null) {
    const varName = match[1];
    if (varName.startsWith('REACT_APP_') || varName.startsWith('VITE_')) {
      envVars.add(varName);
    }
  }
  
  // Look for import.meta.env accesses
  const importMetaRegex = /import\.meta\.env\.([A-Z_0-9]+)/g;
  while ((match = importMetaRegex.exec(configContent)) !== null) {
    const varName = match[1];
    if (varName.startsWith('VITE_')) {
      envVars.add(varName);
    }
  }
  
} catch (err) {
  console.error('Error reading environment.js:', err);
}

// Scan all files for additional environment variable usage
files.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    
    // Look for process.env.REACT_APP_* or process.env.VITE_*
    const processEnvRegex = /process\.env\.([A-Z_0-9]+)/g;
    let match;
    
    while ((match = processEnvRegex.exec(content)) !== null) {
      const varName = match[1];
      if (varName.startsWith('REACT_APP_') || varName.startsWith('VITE_')) {
        envVars.add(varName);
      }
    }
    
    // Look for import.meta.env.VITE_*
    const importMetaRegex = /import\.meta\.env\.([A-Z_0-9]+)/g;
    while ((match = importMetaRegex.exec(content)) !== null) {
      const varName = match[1];
      if (varName.startsWith('VITE_')) {
        envVars.add(varName);
      }
    }
  } catch (err) {
    console.error(`Error reading file ${file}:`, err);
  }
});

// Convert to array and sort
const sortedEnvVars = Array.from(envVars).sort();

// Generate .env.example content
let newContent = `# Asset Anchor Frontend Environment Variables
# ======================================
# 
# IMPORTANT NOTES:
# - This file is versioned and ONLY contains example values
# - Copy to .env for local development
# - All values are injected at build time or through window.__ENV at runtime
# - NEVER put secrets in frontend environment variables
# - All frontend environment variables are publicly visible in the browser
# 
# This file was auto-generated on ${new Date().toISOString()} 
# and documents environment variables used in the application.
# 
# Use this as a reference for configuring your local or production environment.

`;

// Group variables by prefix
const groups = {
  'REACT_APP_API': [],
  'REACT_APP_SOCKET': [],
  'REACT_APP_AUTH': [],
  'REACT_APP_FEATURE': [],
  'REACT_APP_ANALYTICS': [],
  'REACT_APP_SENTRY': [],
  'VITE': [],
  'OTHER': []
};

sortedEnvVars.forEach(varName => {
  let assigned = false;
  
  for (const prefix in groups) {
    if (varName.startsWith(prefix)) {
      groups[prefix].push(varName);
      assigned = true;
      break;
    }
  }
  
  if (!assigned) {
    groups.OTHER.push(varName);
  }
});

// Add variables to content by group
Object.entries(groups).forEach(([group, vars]) => {
  if (vars.length === 0) return;
  
  // Add section header
  const groupTitle = group === 'OTHER' ? 'Other Environment Variables' : `${group} Variables`;
  newContent += `\n# ${groupTitle}\n`;
  
  // Add variables
  vars.forEach(varName => {
    // Get the default value from our parsed config, or use a placeholder
    let defaultValue = defaultValues[varName] || '';
    
    // Format the default value
    if (defaultValue.startsWith("'") || defaultValue.startsWith('"')) {
      // It's a string, remove quotes
      defaultValue = defaultValue.replace(/^['"]|['"]$/g, '');
    } else if (defaultValue === 'true' || defaultValue === 'false') {
      // It's a boolean, keep as is
    } else if (defaultValue === 'undefined' || defaultValue === 'null') {
      defaultValue = '';
    }
    
    // Add variable with comment if present in existing file
    const existingLineRegex = new RegExp(`^${varName}=.*$`, 'm');
    const existingCommentRegex = new RegExp(`^#.*\\n${varName}=.*$`, 'm');
    
    let existingComment = '';
    const commentMatch = existingCommentRegex.exec(existingEnvExample);
    if (commentMatch) {
      existingComment = commentMatch[0].split('\n')[0];
    }
    
    if (existingComment) {
      newContent += `${existingComment}\n`;
    }
    
    newContent += `${varName}=${defaultValue}\n`;
  });
});

// Add warning about secrets
newContent += `
# IMPORTANT:
# - Secrets (API keys, private keys, etc.) should NEVER be stored in this file
# - Use server-side environment variables for sensitive information
`;

// Write to file
try {
  fs.writeFileSync(envExampleFile, newContent);
  console.log(`✅ Successfully generated ${envExampleFile} with ${sortedEnvVars.length} variables.`);
} catch (err) {
  console.error('Error writing .env.example:', err);
  process.exit(1);
}
