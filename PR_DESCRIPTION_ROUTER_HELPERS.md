# test(router): helpers to set useParams/useSearchParams in messages tests

## Summary

This PR adds helper functions to our router mocks to allow tests to consistently set route parameters and search query strings. It also updates the message-related tests to use these new helpers, ensuring that route parameters and search query strings are properly set and maintained across tests.

## Changes

- Added `setParams(params)` and `setSearch(queryString)` helper functions to `src/test/mocks/router.js`
- Updated `MessageCreate.test.jsx` to use `setSearch` for testing the recipient prefill functionality
- Updated `MessageDetail.test.jsx` to use `setParams` for setting the message ID parameter
- Updated `MessageDelete.test.jsx` to use `setParams` for setting the message ID parameter

## Why

Previously, tests were directly manipulating the `currentParams` and `currentSearch` exports, which could lead to inconsistent behavior and made it difficult to reset these values between tests. The new helper functions provide a cleaner, more maintainable way to set and reset these values.

## Testing

All message-related tests now correctly run with consistent route parameters and search query strings. Tests now properly use the helpers in their `beforeEach` blocks to ensure a consistent starting state.

## Acceptance Criteria

- [x] Export `setParams(next)` and `setSearch(queryString)` helpers in `src/test/mocks/router.js`
- [x] Update message tests to call these helpers in `beforeEach` to set expected route state
- [x] `MessageCreate.test.jsx`, `MessageDetail.test.jsx`, and `MessageDelete.test.jsx` all pass param/search expectations
