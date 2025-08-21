# Day 2 Testing Checklist & Documentation

## Overview
This document provides a structured approach to verifying all Day 2 goals for the staging environment:
- Core flows confirmed in staging
- Monitoring systems active and reporting
- Rate limits & CSP behaving as expected
- Multi-tenancy isolation verified

## Prerequisites
1. Staging environment access (admin, landlord, and tenant credentials)
2. Stripe test mode credentials and CLI configured
3. Sentry access for both frontend and backend projects
4. Uptime monitoring access if already set up

## Test Scripts
The following test scripts have been created to automate verification:

1. **Rate Limit Testing**
   - Script: `/scripts/test_rate_limit.py`
   - Usage: `python3 test_rate_limit.py https://staging-api.example.com/api/auth/login 20`
   - Purpose: Verifies Flask-Limiter + Redis is properly configured and rate limiting endpoints

2. **Stripe Webhook Testing**
   - Script: `/scripts/test_stripe_webhook.py`
   - Usage: `python3 test_stripe_webhook.py https://staging-api.example.com/api/webhooks/stripe sk_test_webhook_secret`
   - Purpose: Tests webhook signature verification and idempotency

3. **CSP Analysis**
   - Script: `/scripts/analyze_csp.py`
   - Usage: `python3 analyze_csp.py https://staging.assetanchor.io`
   - Purpose: Analyzes CSP configuration and identifies violations

4. **Multi-tenancy Isolation Testing**
   - Script: `/scripts/test_multi_tenancy.py`
   - Usage: `python3 test_multi_tenancy.py https://staging-api.example.com admin_token`
   - Purpose: Creates test organizations and verifies data isolation

5. **Sentry Integration Testing**
   - Script: `/scripts/test_sentry.py`
   - Usage: `python3 test_sentry.py https://staging-api.example.com https://staging.assetanchor.io`
   - Purpose: Triggers controlled errors and verifies Sentry captures them correctly

## 1. Authentication Flows

### Register Flow ⬜
- Create a new admin account: _______
- Create a new landlord account: _______
- Create a new tenant account: _______
- Verify email verification process for each type: ⬜

### Login Flow ⬜
- Login with admin credentials: ⬜
- Login with landlord credentials: ⬜
- Login with tenant credentials: ⬜
- Verify JWT token issued: ⬜

### Forgot/Reset Password Flow ⬜
- Request password reset for each account type: ⬜
- Complete password reset process: ⬜
- Login with new password: ⬜

## 2. Role-based Access Control

### Admin Access ⬜
- View all properties across organizations: ⬜
- Access admin-only routes: ⬜
- Perform admin functions: ⬜

### Landlord Access ⬜
- View only owned properties: ⬜
- Attempt to access another landlord's properties (should fail): ⬜

### Tenant Access ⬜
- View only assigned units: ⬜
- Attempt to access another tenant's data (should fail): ⬜

## 3. CRUD Operations

### Properties ⬜
- Create property: ⬜
- View property details: ⬜
- Update property information: ⬜
- Delete property (if applicable): ⬜

### Tenants ⬜
- Create tenant: ⬜
- Assign tenant to property: ⬜
- Update tenant information: ⬜
- Remove tenant from property: ⬜

### Maintenance ⬜
- Create maintenance request: ⬜
- Update request status: ⬜
- Complete maintenance request: ⬜

### Messages ⬜
- Send message from tenant to landlord: ⬜
- Send message from landlord to tenant: ⬜
- Verify notifications: ⬜

## 4. Payment Processing

### One-time Checkout Session ⬜
- Create one-time payment with Stripe test card: ⬜
- Verify payment record in database: ⬜
- Check payment history in UI: ⬜

### Subscription Creation ⬜
- Create recurring subscription: ⬜
- Verify subscription record: ⬜
- Test subscription cancellation: ⬜

### Webhook Testing ⬜
- Run webhook test script to verify idempotency: ⬜
- Run webhook test script to verify signature validation: ⬜
- Check logs for proper handling: ⬜

### Payment State Updates ⬜
- Verify invoice marked as paid after payment: ⬜
- Check payment history updated: ⬜
- Verify landlord dashboard reflects payment: ⬜

## 5. Multi-tenancy Verification

### Organization Setup ⬜
- Create two tenant organizations: ⬜
- Create similar data in each (properties, tenants, etc.): ⬜
- Run multi-tenancy test script: ⬜

### Data Isolation ⬜
- Properties isolation verified: ⬜
- Tenants isolation verified: ⬜
- Payments isolation verified: ⬜
- Messages isolation verified: ⬜

### White-labeling / Branding ⬜
- Verify organization-specific branding: ⬜
- Document any customization capabilities: ⬜

## 6. Security and Performance

### CSP Configuration ⬜
- Run CSP analyzer script: ⬜
- Check console for CSP violations: ⬜
- Verify Sentry for CSP reports: ⬜
- Document required CSP adjustments: ⬜

### Rate Limiting ⬜
- Run rate limit test script: ⬜
- Verify 429 responses after limit exceeded: ⬜
- Check response headers for rate limit information: ⬜

### CORS Configuration ⬜
- Test cross-origin requests from allowed origins: ⬜
- Test cross-origin requests from disallowed origins: ⬜

### Lighthouse CI ⬜
- Run Lighthouse tests on key pages: ⬜
- Document performance metrics: ⬜
  - Performance score: _______
  - Accessibility score: _______
  - Best practices score: _______
  - SEO score: _______

## 7. Monitoring

### Sentry Error Tracking ⬜
- Run Sentry test script: ⬜
- Verify backend errors appear in Sentry: ⬜
- Verify frontend errors appear in Sentry: ⬜
- Check environment tags are "staging": ⬜

### Health Checks ⬜
- Verify backend health endpoint responding: ⬜
- Verify frontend loading properly: ⬜
- Set up external uptime monitoring: ⬜

## 8. Final Verification

### End-to-end Flow Testing ⬜
- Complete a full tenant onboarding flow: ⬜
- Complete a full payment flow: ⬜
- Complete a full maintenance request flow: ⬜

## Test Results & Evidence Collection

For each section above, collect the following evidence:

1. **Screenshots** of critical UI flows
2. **API response samples** for key endpoints
3. **Error logs** for any issues encountered
4. **Test script outputs** saved as JSON files
5. **Recommendations** for any necessary fixes or improvements

## Deliverables

1. ✅ **Payments confirmation report** - Document successful payment flows
   - Checkout Session flow: ⬜
   - Subscription flow: ⬜
   - Webhook handling: ⬜
   - Payment record creation: ⬜

2. ✅ **Multi-tenancy verification report** - Document isolation tests
   - Data isolation results: ⬜
   - Potential isolation risks: ⬜
   - White-labeling capabilities: ⬜

3. ✅ **Security verification report** - Document security testing
   - CSP analysis: ⬜
   - Rate limiting effectiveness: ⬜
   - CORS configuration: ⬜

4. ✅ **Monitoring verification report** - Document monitoring setup
   - Sentry integration status: ⬜
   - Health checks configuration: ⬜
   - External monitoring setup: ⬜
