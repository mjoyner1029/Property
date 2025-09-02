// frontend/src/__tests__/framer-motion.test.jsx
import React from 'react';
import { render } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';

// Import our mock version of framer-motion
const framerMotion = require('../test/__mocks__/framer-motion');

describe('Framer Motion Mock Tests', () => {
  test('mock motion components render without crashing', () => {
    const { motion } = framerMotion;
    
    // Test that our motion.div component renders properly
    const { container } = render(<motion.div>Test</motion.div>);
    expect(container).toHaveTextContent('Test');
  });
  
  test('AnimatePresence renders children', () => {
    const { AnimatePresence } = framerMotion;
    
    const { container } = render(
      <AnimatePresence>
        <div>Child Component</div>
      </AnimatePresence>
    );
    
    expect(container).toHaveTextContent('Child Component');
  });
  
  test('useAnimation returns object with start function', () => {
    const { useAnimation } = framerMotion;
    const controls = useAnimation();
    
    expect(controls).toHaveProperty('start');
    expect(typeof controls.start).toBe('function');
  });
});
