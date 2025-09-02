# DOM-Based Testing Strategy

## Overview

This document outlines our strategy for migrating from React Testing Library (RTL) to a DOM-based testing approach. This approach focuses on testing component behavior directly through DOM manipulation rather than through React's rendering lifecycle.

## Why We're Moving to DOM-Based Testing

After experiencing significant challenges with our React test suite, we've identified these key issues:

1. **Brittle Tests**: Small changes to components often break tests due to complex rendering and mock requirements.
2. **React act() Warnings**: Many tests produce act() warnings due to async state updates.
3. **Unreliable Event Handling**: Event simulations in RTL sometimes fail to trigger expected behaviors.
4. **Complex Context Requirements**: Tests need extensive context provider setup and mocking.
5. **Slow Test Execution**: The React rendering lifecycle slows down test execution.

DOM-based testing addresses these issues by:

1. **Bypassing React's Rendering**: Working directly with the DOM eliminates React lifecycle issues.
2. **Simplified Event Handling**: Direct DOM events are more reliable than RTL's event simulation.
3. **Focused Testing**: Tests focus on component behavior rather than implementation details.
4. **Improved Performance**: DOM manipulation is faster than full React rendering.
5. **Reduced Dependency on Mocks**: Simpler test setup with fewer mock requirements.

## Implementation Approach

We've created a comprehensive set of utilities to support DOM-based testing:

1. **Base Utilities** (`domTestUtils.js`):
   - `createDomElement`: Create DOM elements from HTML strings
   - `clearBody`: Clean up the DOM between tests
   - `createForm`: Create and test forms with submit handling
   - `createConfirmDialog`: Test confirmation dialogs and user decisions
   - `createLoadingIndicator`: Test loading states
   - `createErrorMessage`: Test error handling

2. **Common Test Cases** (`commonDomTestCases.js`):
   - `setupNavigationTest`: Navigation component testing
   - `setupNotificationTest`: Notification UI testing
   - `setupAuthTest`: Authentication flows
   - `setupPropertyTest`: Property listing UI
   - `setupMaintenanceTest`: Maintenance request UI

3. **Conversion Script** (`convert-to-dom-test.js`):
   - Automated tool to convert RTL tests to DOM-based tests
   - Generates initial DOM test structure from existing tests
   - Provides guidance for manual adjustments

## Migration Plan

### Phase 1: Infrastructure Setup (Complete)

- ✓ Create base DOM testing utilities
- ✓ Create common test case utilities
- ✓ Create example test files
- ✓ Create migration guide
- ✓ Create conversion script

### Phase 2: Pilot Implementation (In Progress)

- ✓ Convert test files with the most issues first
  - ✓ NotificationDetail.test.jsx
  - ✓ MaintenanceCreate.test.jsx
  - ✓ MaintenanceDelete.test.jsx
  - ✓ PropertyDetail.test.jsx
  - ✓ Login.test.jsx
- □ Evaluate results and refine approach
- □ Document lessons learned and best practices

### Phase 3: Full Migration (Planned)

- □ Convert all remaining test files
- □ Remove obsolete test utilities
- □ Update CI configuration
- □ Conduct team training on DOM testing approach

## Best Practices

### Writing DOM Tests

1. **Test Real User Behavior**: Focus on what the user actually does, not implementation details.
2. **Keep Tests Simple**: Each test should verify one specific behavior.
3. **Minimize Mocks**: Only mock what's absolutely necessary.
4. **Use Data Attributes**: Add data-testid attributes to all important elements.
5. **Clean Up After Tests**: Always use clearBody() in afterEach.

### HTML Structure

When creating DOM elements, mirror the actual HTML structure your component would create:

```jsx
const container = createDomElement(`
  <div class="notification-item" data-testid="notification-123">
    <h3 data-testid="notification-title">New Message</h3>
    <p data-testid="notification-message">You have a new message</p>
    <button data-testid="read-button">Mark as Read</button>
    <button data-testid="close-button">Close</button>
  </div>
`);
```

### Event Handling

Attach event handlers directly to elements:

```jsx
const handleClick = jest.fn();
const button = document.querySelector('[data-testid="read-button"]');
button.addEventListener('click', handleClick);
button.click();
expect(handleClick).toHaveBeenCalledTimes(1);
```

## Resources

- [DOM Testing Migration Guide](/frontend/docs/DOM_TESTING_MIGRATION_GUIDE.md)
- [DOM Testing Utilities README](/frontend/src/test/utils/README.md)
- [Example Tests](/frontend/src/__tests__/examples/)

## Feedback and Support

If you encounter issues or have suggestions for improving our DOM testing approach, please reach out to the frontend team.
