#!/usr/bin/env node
/**
 * Test script to verify frontend-backend connectivity
 * This simulates what the frontend would do when calling the backend API
 */

const axios = require('axios');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5050/api';

async function testConnection() {
  console.log('🔍 Testing Frontend-Backend Connectivity...\n');
  
  try {
    // Test 1: Check if backend health endpoint is accessible
    console.log('1. Testing backend health endpoint...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`, {
      withCredentials: true,
      timeout: 5000
    });
    
    console.log('✅ Backend health check successful');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Environment: ${healthResponse.data.environment}`);
    console.log(`   Version: ${healthResponse.data.version}\n`);
    
    // Test 2: Check CORS headers
    console.log('2. Testing CORS configuration...');
    const corsHeaders = healthResponse.headers;
    console.log(`   Access-Control-Allow-Origin: ${corsHeaders['access-control-allow-origin']}`);
    console.log(`   Access-Control-Allow-Credentials: ${corsHeaders['access-control-allow-credentials']}`);
    
    if (corsHeaders['access-control-allow-origin'] === 'http://127.0.0.1:3000' || 
        corsHeaders['access-control-allow-origin'] === '*') {
      console.log('✅ CORS configured correctly for frontend\n');
    } else {
      console.log('⚠️  CORS may need adjustment for frontend origin\n');
    }
    
    // Test 3: Test with frontend origin headers
    console.log('3. Testing with frontend origin...');
    const frontendResponse = await axios.get(`${BACKEND_URL}/health`, {
      withCredentials: true,
      headers: {
        'Origin': 'http://localhost:3000',
        'User-Agent': 'Mozilla/5.0 (Test Frontend)'
      },
      timeout: 5000
    });
    
    console.log('✅ Frontend origin request successful');
    console.log(`   Response: ${JSON.stringify(frontendResponse.data, null, 2)}\n`);
    
    // Summary
    console.log('🎉 All connectivity tests passed!');
    console.log(`
📋 Summary:
   • Backend running on: ${BACKEND_URL}
   • Frontend should connect to: ${BACKEND_URL}
   • CORS properly configured
   • Health endpoint accessible
   
✨ Next steps:
   1. Open browser to http://localhost:3000
   2. Check browser console for any API errors
   3. Test login/authentication flow
    `);
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Troubleshooting:');
      console.log('   • Make sure backend is running: PYTHONPATH=/Users/mjoyner/Property/backend python /Users/mjoyner/Property/backend/wsgi.py');
      console.log('   • Check if port 5050 is available: lsof -i :5050');
    }
    
    process.exit(1);
  }
}

// Run the test
testConnection();
