// Mock for framer-motion
jest.mock('framer-motion', () => {
  const mockComponentFactory = (componentName) => {
    return jest.fn(({ children, ...props }) => {
      return { props, children, type: componentName };
    });
  };

  return {
    motion: {
      div: mockComponentFactory('div'),
      form: mockComponentFactory('form'),
      button: mockComponentFactory('button'),
      span: mockComponentFactory('span'),
      p: mockComponentFactory('p'),
      h1: mockComponentFactory('h1'),
      h2: mockComponentFactory('h2'),
      h3: mockComponentFactory('h3'),
      h4: mockComponentFactory('h4'),
      a: mockComponentFactory('a'),
      ul: mockComponentFactory('ul'),
      li: mockComponentFactory('li'),
      input: mockComponentFactory('input'),
      textarea: mockComponentFactory('textarea'),
      img: mockComponentFactory('img'),
      section: mockComponentFactory('section'),
      nav: mockComponentFactory('nav'),
      header: mockComponentFactory('header'),
      main: mockComponentFactory('main'),
      footer: mockComponentFactory('footer'),
      article: mockComponentFactory('article'),
    },
    AnimatePresence: jest.fn(({ children }) => children),
    useAnimation: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
    useInView: jest.fn(() => [null, false]),
    useMotionValue: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      onChange: jest.fn(),
    })),
    useTransform: jest.fn(),
    useSpring: jest.fn(),
    useViewportScroll: jest.fn(() => ({
      scrollY: {
        get: jest.fn(),
        onChange: jest.fn(),
      },
    })),
    animate: jest.fn(),
  };
});

// Export a dummy test to avoid "Your test suite must contain at least one test" error
test('dummy test to avoid test suite error', () => {
  expect(true).toBeTruthy();
});
