# Day 2 Testing Guide

## Overview

This guide explains how to perform the Day 2 testing tasks for verifying:
- Core flows in staging
- Monitoring systems
- Security features (CSP, rate limits, CORS)
- Multi-tenancy isolation

## Quick Start

For automated testing of key components, run:

```bash
# Update the script first with your API URL, frontend URL, admin token, and webhook secret
./scripts/run_day2_tests.sh
```

This will execute all test scripts in sequence and save results to a timestamped folder.

## Manual Testing Requirements

Before running the automated tests, ensure you have:

1. **Staging Environment Access**
   - Admin user credentials
   - Landlord user credentials
   - Tenant user credentials

2. **Stripe Test Account**
   - API keys configured in staging
   - Webhook signing secret
   - Stripe CLI installed (for webhook testing)

3. **Sentry Access**
   - Backend project access
   - Frontend project access

4. **Redis**
   - Configured for rate limiting

## Individual Test Scripts

### 1. Rate Limit Testing

Tests that API rate limiting is properly configured with Redis.

```bash
python3 scripts/test_rate_limit.py https://staging-api.example.com/api/auth/login 20
```

- The first argument is the endpoint to test
- The second argument is the number of requests to make

### 2. Stripe Webhook Testing

Verifies webhook signature verification and idempotency.

```bash
python3 scripts/test_stripe_webhook.py https://staging-api.example.com/api/webhooks/stripe sk_test_webhook_secret
```

- The first argument is your webhook endpoint
- The second argument is your Stripe webhook signing secret

### 3. CSP Analysis

Analyzes Content Security Policy configuration and violations.

```bash
python3 scripts/analyze_csp.py https://staging.assetanchor.io
```

- The argument is your frontend URL

### 4. Multi-tenancy Isolation Testing

Creates test organizations and verifies data isolation.

```bash
python3 scripts/test_multi_tenancy.py https://staging-api.example.com admin_token
```

- The first argument is your API URL
- The second argument is an admin JWT token

### 5. Sentry Integration Testing

Triggers controlled errors and verifies Sentry captures them.

```bash
python3 scripts/test_sentry.py https://staging-api.example.com https://staging.assetanchor.io
```

- The first argument is your API URL
- The second argument is your frontend URL

## Manual Testing Checklist

For features that require manual verification, refer to the comprehensive testing checklist:

```
/test_plans/day2_testing_checklist.md
```

This document provides step-by-step verification tasks for all Day 2 requirements.

## Detailed Testing Plan

For a more comprehensive explanation of testing methodology, refer to:

```
/test_plans/day2_staging_test_plan.md
```

## Test Output and Reports

After running the tests:

1. Automated test outputs will be saved in the `day2_test_results_[timestamp]` directory
2. Manual test results should be documented in the checklist
3. All findings should be summarized in the following deliverables:

   - Payments confirmation report
   - Multi-tenancy verification report
   - Security verification report
   - Monitoring verification report

## Troubleshooting

### Common Issues

1. **Rate Limit Tests Not Triggering 429**
   - Check that Redis is properly configured
   - Verify that `RATELIMIT_STORAGE_URI` is set correctly
   - Ensure `DISABLE_RATE_LIMIT` is not set to true

2. **Webhook Tests Failing**
   - Verify webhook secret is correct
   - Check that webhook endpoint is properly configured

3. **Multi-tenancy Tests Failing**
   - Ensure admin token has sufficient permissions
   - Check that API endpoints match your application structure

4. **Sentry Not Capturing Events**
   - Verify Sentry DSN is correctly configured
   - Check that environment is set to "staging"
   - Ensure source maps are properly uploaded (frontend)
