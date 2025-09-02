# Scripts Inventory and Documentation

This document provides an overview of the utility scripts in the Property project, their purpose, and usage instructions.

## Security and Compliance Scripts

### verify_security_headers.py
**Primary script for security header verification**

This comprehensive script checks:
- Security headers presence and configuration
- Rate limiting functionality
- CSP report endpoint
- CSP enforcement status

```bash
python3 scripts/verify_security_headers.py --url https://yourapi.example.com
```

### analyze_csp.py
**Content Security Policy analyzer**

This specialized script for CSP analysis:
- Checks CSP headers and directives
- Generates browser-based CSP violation checker
- Provides Sentry integration for violation reporting

```bash
python3 scripts/analyze_csp.py https://yourfrontend.example.com
```

### check_security_headers.py [DEPRECATED]
**Simple security header checker**

This script has been deprecated in favor of `verify_security_headers.py`, which provides more comprehensive checking.
The script remains for backward compatibility with CI/CD pipelines if needed.

### verify_stripe_webhook.py
**Stripe webhook verification tool**

Performs several checks to ensure Stripe webhooks are properly configured:
- Verifies environment variables
- Checks webhook endpoint accessibility
- Validates webhook signature verification

```bash
python3 scripts/verify_stripe_webhook.py
```

### check_env.py
**Environment variable validator**

Validates that all required environment variables are properly set:
- Checks for required variables based on environment (dev/prod)
- Validates URL formats and security requirements
- Reports missing or malformed variables

```bash
python3 scripts/check_env.py
```

## Testing Tools

### test_rate_limit.py
**Rate limit testing utility**

Tests the rate limiting functionality by making multiple rapid requests to an endpoint:
- Tracks when 429 (Too Many Requests) responses appear
- Reports rate limit headers
- Generates a detailed JSON report

```bash
python3 scripts/test_rate_limit.py https://yourapi.example.com/endpoint 20
```

### test_sentry.py
**Comprehensive Sentry integration tester**

Tests that errors are properly reported to Sentry from both frontend and backend:
- Triggers controlled errors with unique identifiers
- Verifies errors appear in Sentry with proper context
- Checks environment tags
- Tests health endpoints
- Provides uptime monitoring setup instructions

```bash
python3 scripts/test_sentry.py https://api.example.com https://frontend.example.com
```

### quick_test_sentry.py
**Simple Sentry integration tester**

A simplified version to quickly test Sentry integration:
- Sends a request to the debug-sentry endpoint to trigger a test error
- Confirms connection to the backend
- Ideal for quick verification of Sentry setup

```bash
python3 scripts/quick_test_sentry.py
```

### test_stripe_webhook.py
**Stripe webhook tester**

Tests the Stripe webhook endpoint functionality:
- Simulates various Stripe webhook events
- Tests idempotency and signature verification
- Requires the Stripe CLI to be installed

```bash
python3 scripts/test_stripe_webhook.py https://api.example.com/webhooks/stripe sk_test_webhook_secret
```

### test_multi_tenancy.py
**Multi-tenancy isolation tester**

Tests isolation between tenant organizations:
- Creates test tenant organizations
- Creates similar data in each organization
- Tests for data leakage between organizations
- Verifies strict isolation across entities

```bash
python3 scripts/test_multi_tenancy.py https://api.example.com admin_token
```

### smoke_test.py
**Deployment smoke test**

Runs basic smoke tests against a deployed environment:
- Checks API connectivity and core endpoints
- Verifies authentication flows
- Tests basic data operations

```bash
python3 scripts/smoke_test.py https://api.example.com
```

## File Management Tools

### consolidate_new_files.py
**Utility for managing .new files**

This script helps manage file versions by:
- Finding all .new files in the repository
- Comparing them with their original counterparts
- Offering interactive or automated consolidation

```bash
# Interactive mode
python3 scripts/consolidate_new_files.py

# Keep newest files automatically
python3 scripts/consolidate_new_files.py --mode keep-newest

# Dry run to see what would happen
python3 scripts/consolidate_new_files.py --mode dry-run
```

## Deployment Scripts

### pre-deploy-check.sh
**Pre-deployment validation**

Runs checks before deployment to prevent common issues:
- Security header verification
- Environment variable checks
- Linting and tests

### run_migrations.sh
**Database migration executor**

Executes database migrations safely:
- Backs up database before migrations
- Runs migrations with proper logging
- Handles rollback if needed

### tag_release.sh
**Release tagging utility**

Tags a new release in git with proper versioning:
- Updates version numbers
- Creates git tag
- Generates release notes

### rollback_backend.sh / rollback_frontend.sh
**Deployment rollback utilities**

Roll back deployments if issues are detected:
- Reverts to previous known-good version
- Restores database if needed (backend)
- Updates DNS/CDN if needed (frontend)

### release_readiness_gate.sh
**Release readiness checker**

Validates that all prerequisites are met before proceeding with a release:
- Checks required environment variables
- Verifies access to deployment platforms
- Ensures all tests are passing

### run_day2_tests.sh
**Day 2 test suite runner**

Runs all the day 2 verification tests in sequence:
- Executes security tests
- Checks multi-tenancy isolation
- Tests integrations (Stripe, Sentry)
- Verifies performance metrics

### update_monitoring.sh
**Monitoring configuration updater**

Updates monitoring configuration files:
- Synchronizes dashboard definitions
- Updates alert rules
- Ensures consistent monitoring across environments

### generate_secrets.sh
**Secret generator**

Generates strong random secrets suitable for production:
- Creates secure SECRET_KEY and JWT_SECRET_KEY values
- Outputs values for use in environment variables
