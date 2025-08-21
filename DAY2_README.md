# Day 2 - Staging Hardening & Verification

This repository contains all the necessary resources for completing Day 2 staging environment verification, ensuring core flows are working, monitoring is live, and security features like rate-limiting and CSP are functioning properly.

## Quick Start

```bash
# 1. Clone this repository (if not already done)
git clone https://github.com/mjoyner1029/Property.git
cd Property

# 2. Update the test configuration
# Edit scripts/run_day2_tests.sh and update API_URL, FRONTEND_URL, etc.

# 3. Run the test suite
./scripts/run_day2_tests.sh

# 4. Follow the manual testing checklist
open test_plans/day2_testing_checklist.md
```

## Repository Structure

```
Property/
├── docs/
│   ├── DAY2_TESTING_GUIDE.md       # Detailed guide on running tests
│   └── DAY2_VERIFICATION_SUMMARY.md # Summary of Day 2 verification approach
├── scripts/
│   ├── analyze_csp.py              # CSP analysis tool
│   ├── run_day2_tests.sh           # Master script to run all tests
│   ├── test_multi_tenancy.py       # Tests multi-tenant isolation
│   ├── test_rate_limit.py          # Tests rate limiting
│   ├── test_sentry.py              # Tests Sentry integration
│   └── test_stripe_webhook.py      # Tests webhook handling
└── test_plans/
    ├── day2_staging_test_plan.md   # Comprehensive test plan
    └── day2_testing_checklist.md   # Step-by-step verification checklist
```

## Day 2 Goals

1. **App QA in Staging**
   - Auth flows (register, login, forgot/reset, verify)
   - Role-based access control
   - CRUD operations (properties, tenants, maintenance, messages)
   - End-to-end payment processing

2. **Multi-tenancy Verification**
   - Create test tenants (organizations)
   - Verify strict data isolation
   - Test white-labeling capabilities

3. **Security & Performance**
   - CSP configuration and reporting
   - Rate limiting with Redis
   - CORS configuration
   - Performance baseline with Lighthouse

4. **Monitoring**
   - Sentry error tracking (backend & frontend)
   - Health checks and uptime monitoring

## Required Credentials

To run the full suite of tests, you'll need:

1. Admin account credentials
2. Stripe test mode API keys and webhook secret
3. Sentry access for both backend and frontend
4. Test accounts for each role (admin, landlord, tenant)

## Deliverables

After completing the tests, prepare the following reports:

1. **Payments Confirmation Report**
   - Document end-to-end payment flows
   - Verify webhook handling
   - Confirm payment state updates

2. **Multi-tenancy Verification Report**
   - Document tenant isolation tests
   - Identify any potential data leakage
   - Evaluate white-labeling capabilities

3. **Security Verification Report**
   - Analyze CSP effectiveness
   - Document rate limiting tests
   - Verify CORS configuration

4. **Monitoring Verification Report**
   - Confirm Sentry integration
   - Document health check endpoints
   - Verify external monitoring setup

## Further Information

For more details, see:
- [Day 2 Testing Guide](docs/DAY2_TESTING_GUIDE.md)
- [Day 2 Verification Summary](docs/DAY2_VERIFICATION_SUMMARY.md)
- [Staging Test Plan](test_plans/day2_staging_test_plan.md)
