#!/usr/bin/env node
/**
 * Asset Anchor Frontend Verification
 * 
 * This script verifies that the frontend is running and can communicate with the backend API.
 * It checks:
 * 1. The frontend is accessible (returns 200 OK)
 * 2. The backend API health endpoint is accessible from the frontend
 * 
 * Usage:
 *   node check_frontend.mjs [--frontend-url <url>] [--api-url <url>]
 */

import fetch from 'node-fetch';
import { parseArgs } from 'node:util';

// Parse command line arguments
const options = {
  'frontend-url': {
    type: 'string',
    default: 'https://assetanchor.io'
  },
  'api-url': {
    type: 'string', 
    default: 'https://api.assetanchor.io/api/health'
  }
};

const { values } = parseArgs({ options });
const frontendUrl = values['frontend-url'];
const apiUrl = values['api-url'];

// ANSI color codes for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

async function checkFrontendAccess() {
  console.log(`Checking frontend access at ${frontendUrl}...`);
  try {
    const response = await fetch(frontendUrl);
    
    if (response.status === 200) {
      console.log(`${GREEN}✓ Frontend is accessible (Status: ${response.status})${RESET}`);
      return true;
    } else {
      console.error(`${RED}✗ Frontend returned unexpected status: ${response.status}${RESET}`);
      return false;
    }
  } catch (error) {
    console.error(`${RED}✗ Failed to connect to frontend: ${error.message}${RESET}`);
    return false;
  }
}

async function checkApiAccess() {
  console.log(`Checking API access at ${apiUrl}...`);
  try {
    const response = await fetch(apiUrl);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`${GREEN}✓ API is accessible (Status: ${response.status})${RESET}`);
      console.log(`API version: ${data.version}, Database: ${data.database}`);
      return true;
    } else {
      console.error(`${RED}✗ API returned unexpected status: ${response.status}${RESET}`);
      return false;
    }
  } catch (error) {
    console.error(`${RED}✗ Failed to connect to API: ${error.message}${RESET}`);
    return false;
  }
}

async function main() {
  console.log('Starting Asset Anchor frontend verification...');
  
  const frontendSuccess = await checkFrontendAccess();
  const apiSuccess = await checkApiAccess();
  
  if (frontendSuccess && apiSuccess) {
    console.log(`${GREEN}✓ All checks passed!${RESET}`);
    process.exit(0);
  } else {
    console.error(`${RED}✗ One or more checks failed${RESET}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${RED}✗ Unexpected error: ${error.message}${RESET}`);
  process.exit(1);
});
