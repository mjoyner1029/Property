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
    // Map MUI variants to HTML elements
    const variantToElement = {
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      h4: 'h4',
      h5: 'h5',
      h6: 'h6',
      subtitle1: 'h6',
      subtitle2: 'h6',
      body1: 'p',
      body2: 'p',
      caption: 'span',
      button: 'span',
      overline: 'span',
      default: 'p'
    };
    
    const Component = component || variantToElement[variant] || variantToElement.default;
    
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
