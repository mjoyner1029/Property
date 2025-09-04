# Testing Library & Jest DOM Lint Integration

This PR adds eslint-plugin-testing-library and eslint-plugin-jest-dom to enforce best practices in our test files.

## Changes:

1. Added new ESLint plugins:
   - eslint-plugin-testing-library
   - eslint-plugin-jest-dom

2. Created `.eslintrc.js` that extends:
   - plugin:testing-library/react
   - plugin:jest-dom/recommended

3. Fixed all syntax errors in test files:
   - Resolved double imports of `screen`
   - Fixed missing closing parentheses
   - Added missing imports
   - Fixed undefined variables

## Next Steps:

There are still several lint errors to fix in a follow-up PR:

1. **Direct Node Access:** Replace all instances of `.querySelector` with proper Testing Library queries:
   ```js
   // Replace this:
   container.querySelector('.button')
   
   // With this:
   screen.getByRole('button')
   ```

2. **Multiple Assertions in waitFor:** Split each waitFor into a separate assertion:
   ```js
   // Replace this:
   await waitFor(() => {
     expect(something).toBeTrue();
     expect(somethingElse).toBeFalse();
   });
   
   // With this:
   await waitFor(() => expect(something).toBeTrue());
   await waitFor(() => expect(somethingElse).toBeFalse());
   ```

3. **Destructuring Queries:** Use screen instead:
   ```js
   // Replace this:
   const { getByText } = render(<Component />);
   getByText('Hello');
   
   // With this:
   render(<Component />);
   screen.getByText('Hello');
   ```

4. **Avoid Container Methods:** Use Testing Library queries instead:
   ```js
   // Replace this:
   container.firstChild
   
   // With this:
   screen.getByRole('heading')  // or appropriate query
   ```

5. **Clean Up Unused Variables:** Many unused imports and variables can be removed.

## Benefits:

- Enforces modern Testing Library best practices
- Improves test reliability and maintainability
- Helps avoid common testing anti-patterns
- Makes tests more resilient to UI implementation changes
