const React = require("react");

const defaultValue = {
  properties: [],
  currentProperty: null,
  loading: false,
  fetchById: jest.fn(async (id) => ({ id, name: `Mock Prop ${id}` })),
  list: jest.fn(async () => []),
  create: jest.fn(async () => ({ id: 1 })),
  update: jest.fn(async () => ({ ok: true })),
  remove: jest.fn(async () => ({ ok: true })),
};

const PropertyContext = React.createContext(defaultValue);

function PropertyProvider({ children, value = defaultValue }) {
  return React.createElement(PropertyContext.Provider, { value }, children);
}

module.exports = { PropertyContext, PropertyProvider, defaultValue };
