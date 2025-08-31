// __mocks__/react-router-dom.js
const mockNavigate = jest.fn();
const mockParams = {};
let mockSearch = ""; // Changed to let since it's reassigned
let mockLocation = {  // Changed to let for consistency
  pathname: '',
  search: '',
  hash: '',
  state: null
};

// Expose methods to set params for test cases
exports.setParams = (params = {}) => {
  Object.assign(mockParams, params);
};

exports.setSearch = (search = "") => {
  mockSearch = search;
  mockLocation.search = search;
};

exports.resetParams = () => {
  Object.keys(mockParams).forEach(key => delete mockParams[key]);
};

// Export mock functions
module.exports = {
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ ...mockParams }),
  useSearchParams: () => [
    new URLSearchParams(mockSearch),
    jest.fn()
  ],
  useLocation: () => ({ ...mockLocation }),
  Navigate: ({ to }) => {
    mockNavigate(to);
    return null;
  }
};
