# Service Mock Reference Guide

This guide explains how to use the centralized service mocks in your tests.

## Available Service Mocks

All service mocks are available in `src/test/mocks/services.js` and can be imported directly:

```jsx
// Import specific mocks you need
import { 
  fetchRequestsMock, 
  createRequestMock, 
  fetchPaymentsMock 
} from "../../test/mocks/services";

// Or import all mocks
import serviceMocks from "../../test/mocks/services";
```

## Automatic Mocking

For automatic mocking with `jest.mock()`, the mocks are re-exported without the "Mock" suffix in `__mocks__/services/index.js`.

## Using Service Mocks in Tests

### Method 1: Direct imports for direct control (Preferred)

```jsx
// Import the mocks directly
import { fetchPaymentsMock } from "../../test/mocks/services";

// In your test
test("calls fetchPayments on mount", () => {
  // Setup return value
  fetchPaymentsMock.mockResolvedValueOnce([{ id: 1, amount: 100 }]);

  render(<YourComponent />);

  // Assert
  expect(fetchPaymentsMock).toHaveBeenCalled();
});
```

### Method 2: Using require() in jest.mock() factories (For context mocking)

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
