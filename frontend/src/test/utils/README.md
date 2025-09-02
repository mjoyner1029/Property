# DOM Testing Utilities

This package provides a set of utilities for creating reliable DOM-based tests for React components.

## Why DOM Testing?

Traditional React testing with React Testing Library can be complex and prone to issues:

1. **Strict Mode Warnings**: React's strict mode generates warnings about unmounted components and state updates.
2. **act() Errors**: Testing state updates often requires wrapping in act() to avoid warnings.
3. **Complex Context Setup**: Tests need complex provider setups to mock context state.
4. **Brittle Element Selection**: Finding elements in deeply nested component trees can be fragile.
5. **Unreliable Events**: Event handling can be unpredictable in the React test environment.

DOM testing solves these issues by working directly with the DOM, bypassing React's rendering lifecycle.

## Getting Started

### Basic DOM Element Creation

```jsx
import { createDomElement, clearBody } from '../test/utils/domTestUtils';

describe('Button Component Test', () => {
  afterEach(() => clearBody());

  test('calls handler when clicked', () => {
    // Create a mock handler
    const handleClick = jest.fn();
    
    // Create a button element
    const button = createDomElement(`
      <button data-testid="test-button">Click me</button>
    `).querySelector('button');
    
    // Attach event listener
    button.addEventListener('click', handleClick);
    
    // Trigger click
    button.click();
    
    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Form Testing

```jsx
import { createForm } from '../test/utils/domTestUtils';

test('submits form with values', () => {
  // Define form fields
  const fields = [
    { name: 'username', label: 'Username', value: 'testuser' },
    { name: 'password', label: 'Password', type: 'password', value: 'password123' }
  ];
  
  // Create form with submit handler
  const handleSubmit = jest.fn();
  const { submitButton } = createForm(fields, handleSubmit);
  
  // Submit the form
  submitButton.click();
  
  // Assert
  expect(handleSubmit).toHaveBeenCalledWith(
    { username: 'testuser', password: 'password123' },
    expect.anything()
  );
});
```

### Dialog Testing

```jsx
import { createConfirmDialog } from '../test/utils/domTestUtils';

test('confirms dialog action', () => {
  // Setup mock handlers
  const handleConfirm = jest.fn();
  const handleCancel = jest.fn();
  
  // Create dialog
  createConfirmDialog(
    'Delete Item', 
    'Are you sure?',
    handleConfirm,
    handleCancel
  );
  
  // Click confirm button
  document.querySelector('[data-testid="confirm-button"]').click();
  
  // Assert
  expect(handleConfirm).toHaveBeenCalledTimes(1);
  expect(handleCancel).not.toHaveBeenCalled();
});
```

## Common Test Cases

For common UI patterns, we provide pre-built test setups:

### Navigation Tests

```jsx
import { setupNavigationTest } from '../test/utils/commonDomTestCases';

test('navigation active link', () => {
  const { getLink } = setupNavigationTest({
    activeLink: '/dashboard'
  });
  
  expect(getLink('dashboard')).toHaveAttribute('aria-current', 'page');
});
```

### Notification Tests

```jsx
import { setupNotificationTest } from '../test/utils/commonDomTestCases';

test('notification badge shows unread count', () => {
  const { badge } = setupNotificationTest({
    count: 5,
    unreadCount: 3
  });
  
  expect(badge.textContent).toBe('3');
});
```

### Authentication Tests

```jsx
import { setupAuthTest } from '../test/utils/commonDomTestCases';

test('submits login credentials', () => {
  const onLogin = jest.fn();
  const { setEmailValue, setPasswordValue, submitLoginForm } = setupAuthTest({
    onLogin
  });
  
  setEmailValue('test@example.com');
  setPasswordValue('password123');
  submitLoginForm();
  
  expect(onLogin).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123'
  });
});
```

### Property Tests

```jsx
import { setupPropertyTest } from '../test/utils/commonDomTestCases';

test('views property details', () => {
  const onViewDetails = jest.fn();
  const { viewProperty } = setupPropertyTest({ onViewDetails });
  
  viewProperty('prop-1');
  
  expect(onViewDetails).toHaveBeenCalledWith('prop-1');
});
```

### Maintenance Request Tests

```jsx
import { setupMaintenanceTest } from '../test/utils/commonDomTestCases';

test('creates new maintenance request', () => {
  const onCreate = jest.fn();
  const { clickCreate } = setupMaintenanceTest({ onCreate });
  
  clickCreate();
  
  expect(onCreate).toHaveBeenCalled();
});
```

## API Reference

### domTestUtils.js

- `createDomElement(html, appendToBody)`: Creates DOM element from HTML
- `clearBody()`: Clears document.body
- `createForm(fields, onSubmit, options)`: Creates a form with fields
- `createConfirmDialog(title, message, onConfirm, onCancel)`: Creates confirmation dialog
- `createLoadingIndicator(message)`: Creates loading spinner
- `createErrorMessage(message, onRetry)`: Creates error message with retry button

### commonDomTestCases.js

- `setupNavigationTest(options)`: Creates navigation test setup
- `setupNotificationTest(options)`: Creates notification test setup
- `setupAuthTest(options)`: Creates authentication test setup
- `setupPropertyTest(options)`: Creates property listing test setup
- `setupMaintenanceTest(options)`: Creates maintenance request test setup

## Examples

For complete examples, see:

- `/frontend/src/__tests__/examples/DomTestExample.test.jsx`
- `/frontend/src/__tests__/examples/CommonDomTestExample.test.jsx`

## Migration Guide

For guidance on migrating existing tests to DOM-based tests, see the [DOM Testing Migration Guide](/frontend/docs/DOM_TESTING_MIGRATION_GUIDE.md).
