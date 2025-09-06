import React, { useState, useEffect } from 'react';
import api, { backendUrl } from '../utils/api';

/**
 * API Connection Test Component
 * Tests the frontend-backend connectivity and displays results
 */
const ApiTestPage = () => {
  console.log('[ApiTestPage] Component rendering, backendUrl:', backendUrl);
  
  const [testResults, setTestResults] = useState({
    loading: true,
    backendUrl: backendUrl,
    healthCheck: null,
    error: null
  });

  useEffect(() => {
    console.log('[ApiTestPage] useEffect running, starting API test...');
    
    const runTests = async () => {
      try {
        console.log('[ApiTestPage] Making health check request...');
        const healthResponse = await api.get('/health');
        console.log('[ApiTestPage] Health check response:', healthResponse);
        
        setTestResults({
          loading: false,
          backendUrl: backendUrl,
          healthCheck: {
            success: true,
            status: healthResponse.status,
            data: healthResponse.data,
            timestamp: new Date().toISOString()
          },
          error: null
        });
        
      } catch (error) {
        console.error('[ApiTestPage] Health check failed:', error);
        
        setTestResults({
          loading: false,
          backendUrl: backendUrl,
          healthCheck: {
            success: false,
            error: error.message,
            status: error.status || 'No status',
            timestamp: new Date().toISOString()
          },
          error: error.message
        });
      }
    };

    runTests();
  }, []);

  const pageStyle = {
    padding: '20px',
    fontFamily: 'monospace',
    backgroundColor: 'white',
    minHeight: '100vh',
    color: 'black'
  };

  if (testResults.loading) {
    return (
      <div style={pageStyle}>
        <h1 style={{ color: 'blue' }}>🔍 API Connectivity Test</h1>
        <p>Testing connection to backend...</p>
        <p><strong>Backend URL:</strong> {testResults.backendUrl}</p>
        <p><strong>Status:</strong> Loading...</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <h1 style={{ color: 'green' }}>🔍 API Connectivity Test Results</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Configuration</h3>
        <ul>
          <li><strong>Backend URL:</strong> {testResults.backendUrl}</li>
          <li><strong>Test Time:</strong> {testResults.healthCheck?.timestamp}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Health Check</h3>
        {testResults.healthCheck?.success ? (
          <div style={{ 
            backgroundColor: '#d4edda', 
            padding: '10px', 
            border: '1px solid #c3e6cb', 
            borderRadius: '4px',
            color: 'black'
          }}>
            <p><strong>✅ Success!</strong></p>
            <p><strong>Status:</strong> {testResults.healthCheck.status}</p>
            <p><strong>Response:</strong></p>
            <pre style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '10px', 
              overflow: 'auto',
              color: 'black'
            }}>
              {JSON.stringify(testResults.healthCheck.data, null, 2)}
            </pre>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            padding: '10px', 
            border: '1px solid #f5c6cb', 
            borderRadius: '4px',
            color: 'black'
          }}>
            <p><strong>❌ Failed!</strong></p>
            <p><strong>Error:</strong> {testResults.healthCheck?.error}</p>
            <p><strong>Status:</strong> {testResults.healthCheck?.status}</p>
          </div>
        )}
      </div>

      <div>
        <h3>Next Steps</h3>
        {testResults.healthCheck?.success ? (
          <ul>
            <li>✅ Backend connectivity verified</li>
            <li>✅ CORS configured properly</li>
            <li>✅ API client working correctly</li>
            <li>🎉 Ready to test application features</li>
          </ul>
        ) : (
          <ul>
            <li>❌ Check that backend is running</li>
            <li>❌ Verify backend is accessible at: {testResults.backendUrl}</li>
            <li>❌ Check browser console for additional errors</li>
            <li>❌ Ensure CORS is configured for frontend origin</li>
          </ul>
        )}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh Test
        </button>
      </div>
    </div>
  );
};

export default ApiTestPage;
