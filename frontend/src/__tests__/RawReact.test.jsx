/**
 * Raw React Test
 * This test uses React.createElement directly with DOM APIs
 * to bypass any potential issues with Testing Library
 */
import React from 'react';
import ReactDOM from 'react-dom';

describe('Raw React Test', () => {
  test('renders element with React.createElement and ReactDOM', () => {
    // Clear any existing content
    document.body.innerHTML = '';
    
    // Create container
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Create React element
    const element = React.createElement('div', null, 'Raw React Test');
    
    // Render directly with ReactDOM
    ReactDOM.render(element, container);
    
    // Log the result
    console.log('Raw React rendering result:', document.body.innerHTML);
    
    // Test
    expect(container.textContent).toBe('Raw React Test');
  });
});
