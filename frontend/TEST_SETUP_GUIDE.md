# Frontend Test Setup Guide

This document explains the new unified test setup and how to update existing tests to use shared mocks.

## Shared Test Mocks

We've created a unified test setup with shared mocks to avoid referencing out-of-scope variables in Jest mock factories. All shared mocks are now located in:

- `/src/test/mocks/router.js` - React Router mocks
- `/src/test/mocks/auth.js` - Authentication context mocks
- `/src/test/mocks/pageTitle.js` - App context mocks (page title, dark mode, etc.)

These are automatically imported in `/src/test/setupTests.js`.

## How to Fix Test Files

Many test files are still failing due to a common issue: Jest mock factories referencing out-of-scope variables. Here's how to fix them:

### 1. Use the Shared Mocks

Rather than creating mocks in each test file, import and use the shared mocks:

```javascript
// Import from the shared mocks instead of creating your own
import { navigateMock, currentParams } from '../test/mocks/router';
import { AuthContextMock, loginMock } from '../test/mocks/auth';
import { AppContextMock, updatePageTitleMock } from '../test/mocks/pageTitle';
```

### 2. Creating Mock Factories That Don't Reference Out-of-Scope Variables

When you need to create a custom mock in a test file, ensure your mock factory doesn't reference any out-of-scope variables:

```javascript
// INCORRECT: References out-of-scope variable
const fetchRequestsMock = jest.fn();
jest.mock('../../context', () => ({
  useMaintenance: () => ({
    fetchRequests: fetchRequestsMock  // ❌ Out-of-scope variable reference
  })
}));

// CORRECT: Defines variables inside the factory function
jest.mock('../../context', () => {
  const mockFetchRequests = jest.fn();
  
  return {
    useMaintenance: () => ({
      fetchRequests: mockFetchRequests // ✅ In-scope variable reference
    })
  };
});

// Then export the mock for use in your tests
export const fetchRequestsMock = jest.fn();
```

### 3. Using require() within the factory function (Recommended)

The most reliable approach is to use `require()` within the factory function to import the mocks:

```javascript
// Import the mocks at the top for use in your test assertions
import { getTenantMock, updateTenantMock } from "../../test/mocks/services";

// In the mock factory, use require() to reference the same mocks
jest.mock("../../context", () => {
  return {
    useTenant: () => ({
      getTenant: require("../../test/mocks/services").getTenantMock,
      updateTenant: require("../../test/mocks/services").updateTenantMock,
    }),
    useApp: () => ({
      updatePageTitle: require("../../test/mocks/pageTitle").updatePageTitleMock,
    }),
  };
});
```

### 4. Using 'mock' prefix (Not recommended)

Jest allows referencing variables with names prefixed by 'mock' (case-insensitive), but this approach is less reliable:

```javascript
const mockFetchRequests = jest.fn();

jest.mock('../../context', () => ({
  useMaintenance: () => ({
    fetchRequests: mockFetchRequests  // May work because variable starts with 'mock'
  })
}));
```

## Missing Files

Some tests are failing because they reference files that don't exist. Ensure that all imported components and pages actually exist in the codebase.

## Running Tests

To run all tests:

```bash
npm test -- --watchAll=false
```

To run a specific test file:

```bash
npm test -- --watchAll=false path/to/test.jsx
```
