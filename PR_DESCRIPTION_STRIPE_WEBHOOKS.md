# Stripe Webhook Idempotency and Production Safety

## Summary
This PR implements production-safe Stripe webhook handling with idempotency support to ensure duplicate webhook events don't result in double-charging or incorrect state updates.

## Changes
- Utilized existing `StripeEvent` model to track processed events
- Verified webhook signatures when `STRIPE_WEBHOOK_SECRET` is configured 
- Added support for dev mode without signature verification (with warning logs)
- Implemented idempotent webhook processing to prevent duplicate events
- Added support for `payment_intent.succeeded` and `invoice.payment_succeeded` events
- Updated Payment and Invoice records when payments are completed
- Added comprehensive tests for webhook handlers including:
  - Dev mode without signature verification
  - Duplicate event detection
  - Signature verification
  - Payment intent handling
  - Invoice payment handling

## Key Implementation Details
1. Added database idempotency via the `StripeEvent` model with unique event IDs
2. Implemented environment-aware signature verification
3. Updated payment and invoice status handling to avoid race conditions
4. Added comprehensive testing with mocked Stripe event construction

## Testing
All tests are passing, with test coverage for:
- Webhook signature verification
- Duplicate event handling
- Payment intent processing
- Invoice payment processing

## Acceptance Criteria
- [x] Duplicate webhook deliveries don't cause duplicate charges/updates
- [x] Tests pass without requiring external Stripe API calls
- [x] Webhook secret is verified in production mode
- [x] Development mode works without webhook secret
