# fix(routes): export expected blueprints + minimal controller handlers

## Changes

- Fixed `docs_routes.py` to export `docs_bp` with `/api/docs` prefix
  - Added minimal JSON response for the root endpoint
  - Ensured `/api/docs/openapi.json` endpoint serves static JSON file if available

- Renamed `messaging_bp` to `messages_bp` in `messages_routes.py`
  - Updated all route decorators to use the new name for consistency

- Fixed `webhook_routes.py` by:
  - Properly defining and exporting `webhook_bp` blueprint
  - Registering Stripe webhook blueprint as expected
  - Removing dead imports for `register_stripe_webhooks`

- Added missing controller methods:
  - `get_user_profile()` in `user_controller.py` to return user data
  - `update_user_profile()` in `user_controller.py` for basic profile updates
  - `get_documents()` in `document_controller.py` to return current user's documents

## Acceptance

- App starts with no "cannot import name ..." errors
- Routes register under expected names
- Basic GET endpoints return 200 status codes
- JWT identity is properly handled and converted to int in all new functions

## Notes

These changes fix the import errors by providing the expected blueprints and controller methods that were being imported but not defined. All added endpoints follow the JWT identity normalization pattern by converting the identity to an integer.
