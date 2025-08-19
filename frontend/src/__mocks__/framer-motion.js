// Mock for framer-motion
module.exports = {
  motion: {
    div: 'div',
    p: 'p',
    span: 'span',
    button: 'button',
    ul: 'ul',
    li: 'li',
    nav: 'nav',
    section: 'section',
    article: 'article',
    header: 'header',
    footer: 'footer',
    main: 'main',
    aside: 'aside',
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: jest.fn(() => ({
    start: jest.fn().mockResolvedValue(null),
    stop: jest.fn(),
  })),
  useViewportScroll: jest.fn(() => ({
    scrollY: { get: jest.fn(() => 0) },
  })),
  useTransform: jest.fn(() => ({})),
};
