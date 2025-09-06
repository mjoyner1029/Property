import React from 'react';

const MinimalApp = () => {
  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center', 
      backgroundColor: '#f5f5f5', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        🎉 Frontend is Working!
      </h1>
      <p style={{ color: '#666', fontSize: '18px' }}>
        This confirms that React is loading properly.
      </p>
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#e8f5e8', 
        borderRadius: '8px',
        display: 'inline-block'
      }}>
        <p><strong>✅ React App Loading</strong></p>
        <p><strong>✅ JavaScript Working</strong></p>
        <p><strong>✅ CSS Styles Applied</strong></p>
      </div>
    </div>
  );
};

export default MinimalApp;
