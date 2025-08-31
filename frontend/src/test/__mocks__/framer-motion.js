// frontend/src/test/__mocks__/framer-motion.js
// Jest manual mock for 'framer-motion' to keep tests fast and SSR-safe.
// If your Jest config maps 'framer-motion' to this file, this will be used in place of the real lib.

const React = require("react");
const { fn } = require("jest-mock");

const make = (tag) =>
  React.forwardRef(({ children, ...props }, ref) =>
    React.createElement(tag, { ref, ...props }, children)
  );

module.exports = {
  // Basic motion primitives as plain HTML elements (with ref support)
  motion: {
    div: make("div"),
    form: make("form"),
    button: make("button"),
    span: make("span"),
    p: make("p"),
    h1: make("h1"),
    h2: make("h2"),
    h3: make("h3"),
    h4: make("h4"),
    a: make("a"),
    ul: make("ul"),
    li: make("li"),
    input: make("input"),
    textarea: make("textarea"),
    img: make("img"),
    section: make("section"),
  },

  // No-op presence component
  AnimatePresence: ({ children }) =>
    React.createElement(React.Fragment, null, children),

  // Stubbable controls
  useAnimation: () => ({ start: fn() }),

  // Tuple-shaped stub (ref + inView boolean) for compatibility with tuple usage
  useInView: () => [React.createRef(), false],
};
