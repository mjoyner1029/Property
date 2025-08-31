// src/test/mocks/router.js

// Create mock variables
const navigateMock = jest.fn();
// Use let instead of const for variables that will be modified
let paramsMock = { id: "123" };
let searchMock = "?q=foo";
let locationMock = {
  pathname: '/test',
  search: searchMock,
  hash: '',
  state: null
};

/**
 * Helper function to set route params for tests
 * @param {Object} params - The route parameters to set
 * @returns {Object} The updated params object
 */
const setParams = (params) => {
  // Replace entire object instead of modifying it property by property
  paramsMock = { ...paramsMock, ...params };
  return paramsMock;
};

/**
 * Helper function to set search query string for tests
 * @param {string} queryString - The query string to set (with or without leading ?)
 * @returns {string} The updated search string
 */
const setSearch = (queryString) => {
  // Ensure the query string starts with ?
  searchMock = queryString.startsWith('?') ? queryString : `?${queryString}`;
  // Also update the location mock to keep them in sync
  locationMock.search = searchMock;
  return searchMock;
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
  currentLocation: locationMock,
  // Export helper functions
  setParams,
  setSearch
};
