import React from 'react';
// Use pure render to bypass any potential mocks or configuration issues
import { render } from '@testing-library/react/pure';

describe('Pure Render Test', () => {
  test('should render with pure render function', () => {
    // Try the most basic possible render
    const { container, debug } = render(<div>Pure test</div>);
    
    // Log debugging info
    debug();
    console.log('Pure container HTML:', container.innerHTML);
    
    // Check content
    expect(container).toHaveTextContent('Pure test');
  });
});
