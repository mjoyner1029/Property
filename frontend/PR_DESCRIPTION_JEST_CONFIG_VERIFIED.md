# Fixed Jest test configuration and sanity test

## Changes
- Updated Jest configuration in `jest.config.js` to:
  - Set `testEnvironment: 'jsdom'`
  - Use correct setup file in `setupFilesAfterEnv` pointing to `src/test/setupTests.js`
  - Added proper module mappings for CSS and image files

- Created and added `fileMock.js` to mock image/asset imports
- Created `babel.config.js` to configure babel for JSX/React processing
- Fixed `app.sanity.test.jsx` by:
  - Correctly mocking all required providers and contexts
  - Mocking route guards to avoid auth dependency issues
  - Ensuring proper component hierarchy for tests

## Testing
- Verified that `app.sanity.test.jsx` now passes
- Confirmed test environment is using jsdom properly
- Ensured setup files are loaded and running

## Notes
- Some other tests are still failing due to component implementation issues, not configuration
- There's a duplicate framer-motion mock in two locations that could be consolidated
- The test environment is now properly configured and tests can be fixed incrementally
