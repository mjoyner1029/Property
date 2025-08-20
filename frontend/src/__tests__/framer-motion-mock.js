// Mock for framer-motion
import React from 'react';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    form: ({ children, ...props }) => React.createElement('form', props, children),
    button: ({ children, ...props }) => React.createElement('button', props, children),
    span: ({ children, ...props }) => React.createElement('span', props, children),
    p: ({ children, ...props }) => React.createElement('p', props, children),
    h1: ({ children, ...props }) => React.createElement('h1', props, children),
    h2: ({ children, ...props }) => React.createElement('h2', props, children),
    h3: ({ children, ...props }) => React.createElement('h3', props, children),
    h4: ({ children, ...props }) => React.createElement('h4', props, children),
    a: ({ children, ...props }) => React.createElement('a', props, children),
    ul: ({ children, ...props }) => React.createElement('ul', props, children),
    li: ({ children, ...props }) => React.createElement('li', props, children),
    input: (props) => React.createElement('input', props),
    textarea: (props) => React.createElement('textarea', props),
    img: (props) => React.createElement('img', props),
    section: ({ children, ...props }) => React.createElement('section', props, children),
    nav: ({ children, ...props }) => React.createElement('nav', props, children),
    header: ({ children, ...props }) => React.createElement('header', props, children),
    main: ({ children, ...props }) => React.createElement('main', props, children),
    footer: ({ children, ...props }) => React.createElement('footer', props, children),
    article: ({ children, ...props }) => React.createElement('article', props, children)
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({ 
    start: jest.fn(),
    stop: jest.fn()
  }),
  useInView: () => [null, false],
  useMotionValue: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    onChange: jest.fn()
  })),
  useTransform: jest.fn(),
  useSpring: jest.fn(),
  useViewportScroll: jest.fn(() => ({
    scrollY: {
      get: jest.fn(),
      onChange: jest.fn()
    }
  })),
  animate: jest.fn()
}));

// Export a dummy test to avoid "Your test suite must contain at least one test" error
test('dummy test to avoid test suite error', () => {
  expect(true).toBeTruthy();
});
