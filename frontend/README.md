# Asset Anchor Frontend

This is the frontend codebase for the Asset Anchor property management application.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

## Running Tests

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test
```

Run tests without watch mode:

```bash
npm test -- --watchAll=false
```

Run a specific test:

```bash
npm test -- --watchAll=false path/to/test.jsx
```

## Test Setup

We've implemented a unified test setup with shared mocks to avoid out-of-scope variable reference issues in Jest mock factories. See the [TEST_SETUP_GUIDE.md](./TEST_SETUP_GUIDE.md) for details on how to update test files.

### Key Files

- `/src/test/setupTests.js` - Main test setup file
- `/src/test/mocks/` - Shared mocks for router, auth, and app contexts
- `/src/test/styleMock.js` - Mock for CSS/SCSS imports

## Building for Production

```bash
npm run build
```

## Project Structure

- `/src/components/` - Reusable UI components
- `/src/context/` - React context providers
- `/src/pages/` - Page components
- `/src/utils/` - Utility functions
- `/src/test/` - Test utilities and shared mocks
- `/src/__tests__/` - Test files

## Deployment Notes

See [DEPLOY_NOTES.md](./DEPLOY_NOTES.md) for deployment information.
