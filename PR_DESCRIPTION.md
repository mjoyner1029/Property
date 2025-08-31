# Fix Jest Mock Factory Scope Issues

## Problem

Several tests were failing due to mock declaration order issues:
1. Mock functions (like `navigateMock`) were being referenced by `jest.mock()` factory functions before they were declared
2. Constant variables (`const`) were being reassigned in helper functions, causing "Assignment to constant variable" errors

## Changes

### Fixed Mock Declaration Order

- Fixed variable name inconsistency in `MessageDetail.test.jsx`: changed reference from `mockNavigate` to `navigateMock` to match imported mock

### Eliminated Variable Reassignment Errors

- Changed declarations from `const` to `let` for variables that are reassigned:
  - In `/src/test/mocks/router.js`: `paramsMock`, `searchMock`, `locationMock`
  - In `/__mocks__/react-router-dom.js`: `mockSearch`, `mockLocation`
  
- Improved `setParams` function to avoid direct property mutation:
  ```js
  // Old implementation (problematic)
  const setParams = (params) => {
    Object.keys(params).forEach(key => {
      paramsMock[key] = params[key]; // Modifies properties of a const
    });
    return paramsMock;
  };
  
  // New implementation 
  const setParams = (params) => {
    paramsMock = { ...paramsMock, ...params }; // Replaces entire object
    return paramsMock;
  };
  ```

## Tests

- Verified that reference errors in `MessageDetail.test.jsx` are resolved
- Verified that "Assignment to constant variable" errors in router mocks are fixed

## Additional Notes

Some tests are still failing due to other issues (like missing DOM elements, empty contexts, etc.), but the specific issues related to mock hoisting and constant reassignment have been fixed.
