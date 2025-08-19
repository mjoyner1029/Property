// Mock for framer-motion
module.exports = {
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
    section: ({ children, ...props }) => React.createElement('section', props, children)
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({ start: jest.fn() }),
  useInView: () => [null, false]
};
