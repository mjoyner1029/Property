// src/test/__mocks__/router.js

// Create mock variables
const navigateMock = jest.fn();
const paramsMock = { id: "123" };
const searchMock = "?q=foo";
const locationMock = {
  pathname: '/test',
  search: searchMock,
  hash: '',
  state: null
};

// CommonJS exports for use with require()
module.exports = {
  navigateMock,
  paramsMock,
  searchMock,
  locationMock,
  // Export params and search for convenient access
  currentParams: paramsMock,
  currentSearch: searchMock,
  currentLocation: locationMock
};
