# PR: Make Stripe webhook idempotent and production-safe

## Changes

### Added `StripeEvent` Model
- Created `StripeEvent` model with unique event_id for deduplication
- Added fields for event tracking: event_type, api_version, created_at, processed_at, payload

### Webhook Handler Improvements
- Added signature verification when `STRIPE_WEBHOOK_SECRET` is set
- Added dev mode without signature verification (with warning) for local development
- Added event storage in database to prevent duplicate event processing
- Added robust error handling with appropriate HTTP status codes
- Updated event processing to handle multiple event types

### New Event Handlers
- Added `handle_payment_intent_succeeded` handler to update Payment records
- Added `handle_invoice_payment_succeeded` handler to update Invoice records
- Added `handle_checkout_completed` handler for Checkout sessions
- Added `handle_payment_failed` handler for failed payments

### Test Coverage
- Added tests for signature verification
- Added tests for duplicate event detection
- Added tests for event processing for different event types
- Added tests for error handling
- Added mocking for Stripe API calls

## Security Improvements
- Webhook signature verification prevents tampering with webhook payloads
- Safe serialization of event data to avoid object serialization issues
- Idempotent event processing protects against duplicate charges

## Notes for Deployment
- Requires `STRIPE_WEBHOOK_SECRET` to be set in production for secure signature verification
- Compatible with Stripe API version 2020-08-27 and later
- Logging added for troubleshooting webhook issues
