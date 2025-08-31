# Service Mock Reference Guide

This guide explains how to use the centralized service mocks in your tests.

## Available Service Mocks

All service mocks are available in the following files:
- `src/test/mocks/services.js` - API service function mocks
- `src/test/mocks/auth.js` - Authentication context mocks
- `src/test/mocks/router.js` - Router-related mocks
- `src/test/mocks/pageTitle.js` - App context and page title mocks

## CommonJS Format

All mock files now use CommonJS format with `module.exports`, which makes them compatible with Jest's `require()` in factory functions:

```javascript
// Example of a mock file (src/test/mocks/services.js)
const fetchRequestsMock = jest.fn();
const createRequestMock = jest.fn();

module.exports = {
  fetchRequestsMock,
  createRequestMock,
  // other mocks...
};
```

## Using Service Mocks in Tests

### Method 1: Direct imports

```jsx
// Import the mocks directly
import { 
  fetchPaymentsMock, 
  createPaymentMock 
} from "../../test/mocks/services";
import { 
  isAuthenticatedMock, 
  registerMock 
} from "../../test/mocks/auth";
import { navigateMock } from "../../test/mocks/router";

// In your test
test("calls fetchPayments on mount", () => {
  // Setup return value
  fetchPaymentsMock.mockResolvedValueOnce([{ id: 1, amount: 100 }]);

  render(<YourComponent />);

  // Assert
  expect(fetchPaymentsMock).toHaveBeenCalled();
});
```

### Method 2: Using require() in jest.mock() factories

```jsx
// IMPORTANT: Using require() in jest.mock() factory functions
jest.mock("../../context", () => ({
  usePayment: () => ({
    payments: [],
    loading: false,
    error: null,
    // ✅ Correct: Use require() to access mocks in factory functions
    fetchPayments: require("../../test/mocks/services").fetchPaymentsMock
  }),
  useMaintenance: () => ({
    maintenanceRequests: [],
    stats: { open: 0, inProgress: 0, completed: 0, total: 0 },
    loading: false,
    error: null,
    // ✅ Correct: Use require() to access mocks in factory functions
    fetchRequests: require("../../test/mocks/services").fetchRequestsMock
  }),
}));
```

## Common Mistakes to Avoid

### ❌ Invalid: Direct variable reference in jest.mock() factory

```jsx
// Don't do this - will cause Jest errors
import { fetchPaymentsMock } from "../../test/mocks/services";

// ❌ ERROR: Invalid out-of-scope variable reference
jest.mock("../../context", () => ({
  usePayment: () => ({
    fetchPayments: fetchPaymentsMock // Error: Invalid reference
  })
}));
```

### ✅ Correct: Use require() inside factory function

```jsx
// ✅ Correct approach
jest.mock("../../context", () => ({
  usePayment: () => ({
    fetchPayments: require("../../test/mocks/services").fetchPaymentsMock
  })
}));
```

## Why This Approach?

Jest isolates each module during testing. Variables from the outer scope are not available inside the factory functions of `jest.mock()`. The `require()` approach works because it executes at runtime within the scope of the factory function.

## Controlling Mock Behavior

```jsx
// Setup return values
fetchRequestsMock.mockResolvedValueOnce([{ id: 1, status: "open" }]);

// Check calls
expect(fetchRequestsMock).toHaveBeenCalledWith("123");

// Reset between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

## Mock File Reference

| Mock File | Purpose | Key Exports |
|-----------|---------|------------|
| `services.js` | API service functions | `fetchRequestsMock`, `createRequestMock`, etc. |
| `auth.js` | Auth context | `isAuthenticatedMock`, `registerMock`, `loginMock`, etc. |
| `router.js` | Router utilities | `navigateMock`, `paramsMock`, `searchMock`, `locationMock` |
| `pageTitle.js` | App context | `updatePageTitleMock`, `toggleDarkModeMock`, etc. |
