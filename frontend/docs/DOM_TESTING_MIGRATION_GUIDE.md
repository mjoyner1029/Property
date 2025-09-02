# DOM-Based Testing Migration Guide

## Overview

This guide explains how to migrate React component tests to DOM-based tests using our `domTestUtils` library. DOM-based testing improves reliability by eliminating React rendering complexities, strict act() warnings, and context provider setup issues.

## Why DOM-Based Testing?

1. **Reliability**: Eliminates React's strict mode warnings and act() errors
2. **Simplicity**: No need to set up complex context providers and mocks
3. **Focus**: Tests the component's DOM behavior directly, not React internals
4. **Speed**: Faster test execution without React's rendering cycle
5. **Maintainability**: Simpler tests that are easier to understand and maintain

## Migration Process

### Step 1: Identify Test Pain Points

Look for tests with these issues:
- React act() warnings
- Complex context provider setup
- Unreliable event handling
- Brittle component mocks
- Tests that fail inconsistently

### Step 2: Create a DOM-Based Test File

Create a new test file with a `.dom.test.jsx` extension:

```jsx
// Original: ComponentName.test.jsx
// New: ComponentName.dom.test.jsx

import { 
  createDomElement, 
  clearBody 
} from '../../test/utils/domTestUtils';

// Use top-level mocks
jest.mock('../../services/api');
jest.mock('../../context/AuthContext');

// Import mocked services
import { someApiCall } from '../../services/api';

describe('ComponentName', () => {
  // Clear the body after each test
  afterEach(() => {
    clearBody();
    jest.clearAllMocks();
  });

  test('renders correctly', () => {
    // Your test here
  });
});
```

### Step 3: Replace React Rendering with DOM Elements

Instead of using `render()` from Testing Library, create DOM elements directly:

```jsx
// Before:
const { getByTestId } = render(<ComponentName />);

// After:
const container = createDomElement(`
  <div data-testid="component-container">
    <h1 data-testid="title">Component Title</h1>
    <button data-testid="action-button">Click Me</button>
  </div>
`);

const title = document.querySelector('[data-testid="title"]');
const button = document.querySelector('[data-testid="action-button"]');
```

### Step 4: Test Event Handlers

Test click handlers and other events directly:

```jsx
// Before:
fireEvent.click(getByTestId('action-button'));
expect(mockHandler).toHaveBeenCalledTimes(1);

// After:
const handleClick = jest.fn();
const button = document.querySelector('[data-testid="action-button"]');
button.addEventListener('click', handleClick);
button.click();
expect(handleClick).toHaveBeenCalledTimes(1);
```

### Step 5: Test Form Submission

Use the `createForm` utility:

```jsx
// Define form fields
const fields = [
  { name: 'username', label: 'Username', value: 'testuser' },
  { name: 'password', label: 'Password', type: 'password', value: 'password123' }
];

// Create form with submit handler
const handleSubmit = jest.fn();
const { form, submitButton } = createForm(fields, handleSubmit);

// Trigger submit
submitButton.click();

// Assert
expect(handleSubmit).toHaveBeenCalledWith(
  { username: 'testuser', password: 'password123' },
  expect.anything()
);
```

### Step 6: Test API Integration

Test API calls directly:

```jsx
// Mock API function
jest.mock('../../services/api', () => ({
  createUser: jest.fn().mockResolvedValue({ id: '123', username: 'testuser' }),
}));

// Import mocked API
import { createUser } from '../../services/api';

// Test API integration
test('submits form and calls API', async () => {
  // Setup form
  const fields = [{ name: 'username', label: 'Username', value: 'testuser' }];
  
  // Create submit handler that calls API
  const handleSubmit = jest.fn(async (data) => {
    await createUser(data);
  });
  
  // Create form
  const { submitButton } = createForm(fields, handleSubmit);
  
  // Submit form
  submitButton.click();
  
  // Wait for promises to resolve
  await new Promise(resolve => setTimeout(resolve, 0));
  
  // Assert
  expect(createUser).toHaveBeenCalledWith({ username: 'testuser' });
});
```

## Available DOM Testing Utilities

Our `domTestUtils.js` library provides these helper functions:

### Basic Elements

- `createDomElement(html, appendToBody)`: Creates a DOM element from HTML string
- `clearBody()`: Clears the document body between tests

### Forms

- `createForm(fields, onSubmit, options)`: Creates a form with fields and submit handler
  - `fields`: Array of field configs (name, label, type, value)
  - `onSubmit`: Handler function called with form data
  - `options`: { title, submitText, disabled, error }

### Dialogs and Notifications

- `createConfirmDialog(title, message, onConfirm, onCancel)`: Creates a confirmation dialog
- `createLoadingIndicator(message)`: Creates a loading spinner with message
- `createErrorMessage(message, onRetry)`: Creates an error message with optional retry button

## Examples

See `/frontend/src/__tests__/examples/DomTestExample.test.jsx` for comprehensive examples of DOM-based testing.

## Tips for Successful Migration

1. **Start simple**: Begin with simpler components that have few dependencies
2. **Keep original tests**: Don't delete the original tests until the DOM tests pass
3. **Use testids**: Make sure your components have data-testid attributes for DOM selection
4. **Mock focused**: Only mock what's absolutely necessary
5. **Test real behavior**: Focus on testing the actual user behavior, not implementation details

## Troubleshooting

- **Event not firing**: Ensure the element is in the DOM and the listener is attached correctly
- **Can't find element**: Check your selector and ensure the element is in the DOM
- **API mock not working**: Make sure jest.mock is at the top level, before imports

## Need Help?

If you're stuck migrating a test, reach out to the team for help, or refer to the existing DOM-based tests in the codebase as examples.
