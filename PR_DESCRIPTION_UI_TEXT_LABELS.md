# UI Text and Label Improvements for Test Matching

## Summary
This PR updates UI text and labels in several components to match the test queries, ensuring that test selectors can find the expected elements in the DOM.

## Changes

### NavBar.jsx
- Updated aria-label to "Account of current user" for the user menu icon button
- Added data-testid="payments-link" to the Payments button in the desktop view
- Added data-testid="payments-menu-item" to the Payments menu item in the mobile view

### NotFound.jsx
- Enhanced the page with Material UI components for consistent styling
- Ensured the 404 code is prominently displayed in an h1 heading
- Added data-testid for easier test selection

### Unauthorized.jsx
- Changed heading text from "Access Denied" to "Unauthorized" to match test expectations
- Reorganized content to ensure "Unauthorized" is the primary heading

## Testing
These changes should resolve issues with tests trying to find:
- Elements with aria-label="Account of current user"
- Links or menu items with text matching /payments/i
- NotFound.jsx with a heading containing "404"
- Unauthorized.jsx with a heading containing "Unauthorized"

## Additional Improvements
- Enhanced the NotFound page with a more consistent design matching the application style
- Added data-testid attributes to make future testing more resilient
