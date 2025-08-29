# PR: Fully Disable Rate Limits During Tests

## Summary

This PR addresses test failures caused by rate limiting by completely disabling Flask-Limiter during test execution. 
It implements several layers of protection to ensure rate limiting is fully disabled during testing:

1. Replaces the Flask-Limiter instance with a completely disabled mock version in test environments
2. Updates conftest.py with comprehensive settings to disable rate limiting
3. Adds configuration in app.py to disable rate limiting at the application level for tests

## Changes

- **src/extensions.py**: 
  - Replaced the limiter with a complete NoOpLimiter class during tests
  - Added request filter to bypass any remaining rate limiting attempts
  - Added WSGI middleware handling to prevent any limiter middleware

- **src/tests/conftest.py**:
  - Added comprehensive configuration to disable rate limiting
  - Added environment variable overrides to force limiter to be disabled

- **src/app.py**:
  - Added early configuration to disable rate limiting during app setup

## Testing

Validated that tests previously failing with 429 Too Many Requests now pass correctly. 
This change allows tests to run without rate limit errors while maintaining normal rate limiting in development and production environments.

## Breaking Changes

None. Production and development rate limiting remains unchanged.

## Environment Variables

None added or changed.

## Acceptance Criteria

Tests that previously failed due to 429 now pass locally without modifying test logic.
