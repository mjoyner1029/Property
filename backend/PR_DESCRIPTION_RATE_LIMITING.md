# PR: Configure Environment-Aware Rate Limits

## Overview
This PR implements environment-aware rate limiting for the Asset Anchor backend. Rate limits are now configurable via environment variables, with strict per-route limits applied to sensitive endpoints. The implementation ensures that tests run without rate limiting to prevent flakiness.

## Changes Made
1. Updated extensions.py to use a NoOpLimiter for testing environments and properly configure Flask-Limiter for production.
2. Added environment variable support for rate limiting configurations in .env.example.
3. Applied strict per-route limits to login and MFA endpoints for better security.
4. Ensured tests disable all rate limiting to prevent test flakiness.
5. Updated test_rate_limiting.py to properly verify the rate limiting behavior.

## Configuration Variables
Added the following environment variables:
- `RATELIMIT_DEFAULT`: Default rate limit for all routes (e.g., "3000 per day, 1000 per hour, 100 per minute")
- `RATELIMIT_STORAGE_URL`: Storage backend for rate limiting (Redis recommended for production)
- `RATELIMIT_ENABLED`: Toggle to globally enable/disable rate limiting

## Testing
- Rate limiting tests now pass
- Manual verification confirms:
  - In dev/prod: Rate limits apply (repeated login hits return 429)
  - In tests: No 429s returned, tests run reliably

## Security Impact
- Added protection against brute force attacks on login endpoints
- Stricter rate limits (10 per 5 minutes) for auth-related endpoints
- General rate limiting for all API endpoints to prevent abuse

## Notes for Reviewers
The NoOpLimiter implementation ensures that tests aren't affected by rate limiting, while maintaining proper rate limits in development and production environments.
