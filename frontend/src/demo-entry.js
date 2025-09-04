// Demo Entry Point
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { DemoAuthProvider, DemoPanel, initDemoMode } from './demo';
import debugDemo, { getDebugInfo } from './demo/debug-demo';

// Override API module for MSW interception
import './demo/utils/api-wrapper';

// Initialize demo mode
initDemoMode().then(() => {
  console.log('🔮 Demo Mode initialized successfully!');
  
  // Make debug functions available globally
  window.debugDemo = debugDemo;
  window.getDemoDebugInfo = getDebugInfo;
  
  // Create a demo version of the app that uses the DemoAuthProvider instead of the real one
  const DemoApp = () => {
    return (
      <BrowserRouter>
        <ErrorBoundary 
          fallback={
            <div style={{ 
              padding: '20px', 
              margin: '20px', 
              border: '1px solid red',
              borderRadius: '5px',
              backgroundColor: '#fff1f1'
            }}>
              <h2>Something went wrong in Demo Mode</h2>
              <p>An error occurred while rendering the application in demo mode.</p>
              <button onClick={() => window.location.reload()}>
                Reload Demo
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('demo_db');
                  localStorage.removeItem('demo_access_token');
                  localStorage.removeItem('demo_refresh_token');
                  window.location.reload();
                }}
                style={{ marginLeft: '10px' }}
              >
                Reset & Reload
              </button>
            </div>
          }
        >
          <DemoAuthProvider>
            <App />
            <DemoPanel />
          </DemoAuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    );
  };
  
  // Force any component using the AuthContext to use our DemoAuthProvider instead
  // This is a hacky but effective way to make sure routing guards work with demo mode
  try {
    // Set environment variable for the App component to detect demo mode
    window.process = window.process || {};
    window.process.env = window.process.env || {};
    window.process.env.REACT_APP_DEMO_MODE = '1';
  } catch (err) {
    console.error('Failed to set demo environment variables:', err);
  }
  
  console.log('🔮 [Demo Mode] Rendering demo application');
  
  // Render the demo app
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <DemoApp />
    </React.StrictMode>
  );
}).catch(error => {
  console.error('Failed to initialize Demo Mode:', error);
  
  // Fallback to standard app rendering in case of error
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <div style={{
        padding: '20px',
        margin: '20px',
        border: '1px solid red',
        borderRadius: '5px',
        backgroundColor: '#fff1f1'
      }}>
        <h2>Demo Mode Failed to Initialize</h2>
        <p>Error: {error.message || 'Unknown error'}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    </React.StrictMode>
  );
});
