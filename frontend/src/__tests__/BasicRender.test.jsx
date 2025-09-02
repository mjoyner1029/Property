import React from 'react';
import ReactDOM from 'react-dom';
import { render, screen } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';

// Check if React is being mocked
console.log('React mock?', jest.isMockFunction(React.createElement));
console.log('ReactDOM mock?', jest.isMockFunction(ReactDOM.render));

// Create a direct test
describe('Basic Render Test', () => {
  // Check setup
  beforeAll(() => {
    console.log('JSDOM version:', window?.navigator?.userAgent);
    console.log('document.body:', document.body.tagName);
    console.log('Testing Library version:', require('@testing-library/react/package.json').version);
  });
  
  // Force native DOM rendering as a test
  test('vanilla DOM', () => {
    const div = document.createElement('div');
    div.textContent = 'DOM Test';
    document.body.appendChild(div);
    console.log('Direct DOM:', document.body.innerHTML);
    expect(document.body.textContent).toContain('DOM Test');
    document.body.removeChild(div);
  });
  
  // Try native React
  test('vanilla React', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    ReactDOM.render(<div>React Test</div>, container);
    console.log('ReactDOM result:', document.body.innerHTML);
    expect(container.textContent).toBe('React Test');
    
    document.body.removeChild(container);
  });

  // Try RTL
  test('RTL render', () => {
    const { container } = render(<div>RTL Test</div>);
    console.log('RTL container:', container.outerHTML);
    console.log('RTL body:', document.body.innerHTML);
    expect(container.textContent).toBe('RTL Test');
  });
});
