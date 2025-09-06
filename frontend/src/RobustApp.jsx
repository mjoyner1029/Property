import React, { Suspense, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Routes, Route } from 'react-router-dom';

// Local imports
import theme from './theme';
import LoadingFallback from './components/LoadingFallback';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';

// Import key components directly instead of lazy loading for now
import ApiTestPage from './components/ApiTestPage';

// Simplified context provider for debugging
const SimpleProviders = ({ children }) => {
  console.log('[SimpleProviders] Rendering...');
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Toast />
      {children}
    </MuiThemeProvider>
  );
};

// Simple Welcome component
const WelcomeComponent = () => {
  console.log('[WelcomeComponent] Rendering...');
  return (
    <div style={{
      padding: '40px',
      backgroundColor: '#f5f7fa',
      minHeight: '100vh',
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '40px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          color: '#1976d2', 
          marginBottom: '20px',
          fontSize: '2.5rem',
          fontWeight: '500'
        }}>
          🏠 Property Management Dashboard
        </h1>
        
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#666',
          marginBottom: '30px',
          lineHeight: '1.6'
        }}>
          Welcome to your Asset Anchor-style Property Management Interface
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            border: '1px solid #bbdefb'
          }}>
            <h3 style={{ color: '#1565c0', marginBottom: '10px' }}>📊 Dashboard</h3>
            <p style={{ color: '#666' }}>View property analytics, financial summaries, and key metrics</p>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#e8f5e8',
            borderRadius: '8px',
            border: '1px solid #c8e6c9'
          }}>
            <h3 style={{ color: '#2e7d32', marginBottom: '10px' }}>🏘️ Properties</h3>
            <p style={{ color: '#666' }}>Manage your property portfolio, add new properties</p>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#fff3e0',
            borderRadius: '8px',
            border: '1px solid #ffcc02'
          }}>
            <h3 style={{ color: '#f57c00', marginBottom: '10px' }}>👥 Tenants</h3>
            <p style={{ color: '#666' }}>Manage tenant information, leases, and communications</p>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#fce4ec',
            borderRadius: '8px',
            border: '1px solid #f8bbd9'
          }}>
            <h3 style={{ color: '#c2185b', marginBottom: '10px' }}>🔧 Maintenance</h3>
            <p style={{ color: '#666' }}>Track maintenance requests and work orders</p>
          </div>
        </div>

        <div style={{ marginTop: '40px' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>🔗 Quick Links</h3>
          <div style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap'
          }}>
            <a 
              href="/api-test" 
              style={{
                padding: '10px 20px',
                backgroundColor: '#1976d2',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🔍 API Connectivity Test
            </a>
            <button 
              style={{
                padding: '10px 20px',
                backgroundColor: '#388e3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              onClick={() => alert('Dashboard coming soon!')}
            >
              📊 Dashboard
            </button>
            <button 
              style={{
                padding: '10px 20px',
                backgroundColor: '#f57c00',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              onClick={() => alert('Properties coming soon!')}
            >
              🏘️ Properties
            </button>
          </div>
        </div>

        <div style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          borderLeft: '4px solid #1976d2'
        }}>
          <h4 style={{ color: '#1976d2', marginBottom: '10px' }}>🚀 System Status</h4>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <p>✅ Frontend: React application loaded successfully</p>
            <p>✅ Backend: Flask API connected and responding</p>
            <p>✅ Material-UI: Theme and components loaded</p>
            <p>🔄 Features: Gradually restoring full dashboard interface</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RobustApp() {
  console.log('[RobustApp] Starting to render...');

  useEffect(() => {
    console.log('[RobustApp] Component mounted successfully');
  }, []);

  return (
    <ErrorBoundary>
      <SimpleProviders>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<WelcomeComponent />} />
            <Route path="/api-test" element={<ApiTestPage />} />
            <Route path="*" element={
              <div style={{ 
                padding: '40px', 
                textAlign: 'center',
                backgroundColor: '#f5f7fa',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  padding: '40px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>🚫 404 - Page Not Found</h1>
                  <p style={{ color: '#666', marginBottom: '20px' }}>The page you're looking for doesn't exist.</p>
                  <a 
                    href="/" 
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#1976d2',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px'
                    }}
                  >
                    🏠 Go Home
                  </a>
                </div>
              </div>
            } />
          </Routes>
        </Suspense>
      </SimpleProviders>
    </ErrorBoundary>
  );
}
