# Test Fix for Reference Errors

## Issue Summary

Jest mock factories have a limitation where they cannot reference out-of-scope variables. Many tests were failing with errors like:

```
ReferenceError: The module factory of `jest.mock()` is not allowed to reference any out-of-scope variables.
Invalid variable access: updatePageTitleMock
```

## Solution

We've applied the following solution pattern:

1. Created shared mock implementations in:
   - `/src/test/mocks/router.js` - For React Router mocks
   - `/src/test/mocks/auth.js` - For authentication context mocks
   - `/src/test/mocks/pageTitle.js` - For app context mocks
   - `/src/test/mocks/services.js` - For API service mocks

2. Used `require()` inside mock factories to import these shared mocks correctly:

```javascript
// Import for use in test assertions
import { updatePageTitleMock } from "../../test/mocks/pageTitle";

// In the mock factory, use require() to reference the same mocks
jest.mock("../../context", () => {
  return {
    useApp: () => ({
      updatePageTitle: require("../../test/mocks/pageTitle").updatePageTitleMock,
    }),
  };
});
```

## Fixed Examples

Example fixed tests:
- `TenantDetail.test.jsx`

For more detailed guidance, see the [TEST_SETUP_GUIDE.md](./TEST_SETUP_GUIDE.md).
