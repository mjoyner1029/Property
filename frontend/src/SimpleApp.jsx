import React from 'react';

function SimpleApp() {
  console.log('[SimpleApp] Component rendering...');
  
  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'white',
      minHeight: '100vh',
      color: 'black',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: 'blue' }}>🎉 Simple App Test</h1>
      <p>This is a simplified version to test if React is working.</p>
      <p><strong>Current Time:</strong> {new Date().toISOString()}</p>
      <p><strong>Location:</strong> {window.location.href}</p>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => alert('Button clicked!')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Button
        </button>
      </div>
    </div>
  );
}

export default SimpleApp;
