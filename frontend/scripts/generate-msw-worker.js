// Script to generate the MSW service worker file
// This is needed for MSW to work in both development and production modes

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
// Remove readline-sync dependency
// const { prompt } = require('readline-sync');

// Paths
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const mockServiceWorkerPath = path.join(publicDir, 'mockServiceWorker.js');

// Check if MSW is installed
try {
  // Updated path for MSW v2
  require.resolve('msw');
} catch (error) {
  console.error('❌ MSW is not installed. Please install it first:');
  console.error('   npm install msw --save');
  process.exit(1);
}

// Check if the service worker file already exists
if (fs.existsSync(mockServiceWorkerPath)) {
  console.log('✅ MSW service worker already exists');
  process.exit(0);
}

// Run MSW CLI to generate the service worker
try {
  console.log('📝 Generating MSW service worker...');
  // Use correct path for MSW v2
  execSync('npx msw init public --save', { stdio: 'inherit' });
  console.log('✅ MSW service worker generated successfully!');
} catch (error) {
  console.error('❌ Failed to generate MSW service worker:', error);
  console.error('You may need to run: npx msw init public --save');
  process.exit(1);
}
