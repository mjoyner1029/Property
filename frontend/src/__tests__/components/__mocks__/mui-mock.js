// frontend/src/__tests__/components/__mocks__/mui-mock.js
import React from 'react';

// Mock basic MUI components with functional equivalents
module.exports = {
  Paper: ({ children, elevation, className, sx, ...props }) => (
    <div 
      data-testid="mui-paper" 
      className={className}
      data-elevation={elevation} 
      {...props}
    >
      {children}
    </div>
  ),
  Typography: ({ variant, component, children, color, sx, ...props }) => {
    // Use the right HTML element based on variant or component
    const Component = component || 
      (variant?.includes('h') ? variant.replace('h', 'h') : 'p');
    
    return (
      <Component 
        data-testid={`mui-typography-${variant}`} 
        data-variant={variant}
        data-color={color}
        {...props}
      >
        {children}
      </Component>
    );
  },
  Box: ({ children, sx, ...props }) => (
    <div data-testid="mui-box" {...props}>
      {children}
    </div>
  ),
  // Add more mocks for MUI components as needed
};
