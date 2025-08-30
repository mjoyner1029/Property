# fix(auth): normalize jwt identity + disable slash strictness

## Changes

- Disabled strict slashes in URL map to avoid 308 redirects when URLs differ only by trailing slash
- Normalized JWT identity handling by converting to int in controllers
- Created a utility function for consistent JWT identity parsing
- Enforced header-only JWT in test configurations
- Updated controllers to handle both dict and direct ID formats for JWT identity

## Acceptance

- Auth-protected routes no longer return 422 for valid tokens
- `/api/...` endpoints no longer 308 when trailing slash differs
- Existing unit tests that create tokens pass without modifying test payloads

## Notes

This PR addresses issues with JWT identity handling where controllers would sometimes receive a dict format and sometimes a direct ID format. By consistently converting to integer, we ensure proper type safety and compatibility across all auth-protected routes.
