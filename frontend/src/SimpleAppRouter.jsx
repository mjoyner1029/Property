import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ApiTestPage from './components/ApiTestPage';

/**
 * Simplified App Component for debugging
 */
function SimpleAppRouter() {
  console.log('[SimpleAppRouter] Component rendering...');
  
  return (
    <div style={{
      backgroundColor: 'white',
      minHeight: '100vh',
      color: 'black'
    }}>
      <Routes>
        <Route path="/" element={
          <div style={{ padding: '20px' }}>
            <h1 style={{ color: 'green' }}>🏠 Property App - Welcome</h1>
            <p>Welcome to the Property Management Application!</p>
            <p><strong>Available Routes:</strong></p>
            <ul>
              <li><a href="/api-test" style={{ color: 'blue' }}>API Test Page</a></li>
            </ul>
          </div>
        } />
        <Route path="/api-test" element={<ApiTestPage />} />
        <Route path="*" element={
          <div style={{ padding: '20px' }}>
            <h1 style={{ color: 'red' }}>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <p><a href="/" style={{ color: 'blue' }}>Go Home</a></p>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default SimpleAppRouter;
