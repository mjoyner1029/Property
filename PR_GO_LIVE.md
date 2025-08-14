# Launch Pipeline + Verification for assetanchor.io

This PR adds the final launch pipeline and verification steps for Asset Anchor's production deployment at assetanchor.io.

## Files Created/Modified

### New Files:
- `.github/workflows/predeploy-prod.yml` - Smoke test verification for production deployment
- `scripts/check_frontend.mjs` - Frontend accessibility check script
- `scripts/stripe_webhook_check.md` - Instructions for testing Stripe webhooks
- `scripts/verify_stripe_webhook.py` - Automated verification script for Stripe webhook security
- `scripts/verify_security_headers.py` - Automated verification of security headers and rate limiting
- `scripts/tag_release.sh` - Script for creating versioned releases
- `docs/DNS_SETUP_QUICK.md` - Quick reference for DNS configuration

### Modified Files:
- `.github/workflows/backend-deploy.yml` - Added pre-deploy and post-deploy verification
- `.github/workflows/frontend-deploy.yml` - Added backend dependency and frontend verification
- `scripts/smoke_test.py` - Updated to support `--base-url` parameter
- `docs/GO_LIVE_CHECKLIST.md` - Updated to reference the DNS setup guide
- `docs/RELEASES.md` - Added quick rollback commands
- `scripts/operator_runbook.md` - Added CSP enforcement instructions

## Pre-deploy Gate Details

The pre-deploy gate works as follows:

1. When deploying to production, the `predeploy-prod.yml` workflow is triggered
2. It runs smoke tests against the API to verify essential functionality
3. Only if these tests pass will the backend deployment continue
4. After deployment, the same tests are run against the live environment to verify

To run smoke tests locally:

```bash
# Test against local environment
python scripts/smoke_test.py --url http://localhost:5050

# Test against production
python scripts/smoke_test.py --url https://api.assetanchor.io
```

## Operator Sequence

After merging this PR, the following sequence will occur automatically:

1. CI runs pre-deploy gate against current production API
2. If successful, Render deploys the backend service
3. After backend deployment completes, database migrations are run
4. Post-deploy API smoke tests run against the new deployment
5. Frontend workflow is triggered by successful backend deployment
6. Vercel deploys the frontend service
7. Frontend verification script checks accessibility and API connectivity

## Optional Manual Steps

After deployment is complete, optionally run a Stripe webhook test:

1. Follow instructions in `scripts/stripe_webhook_check.md`
2. This will verify that webhook handling works in production

## Verification Steps

- Confirm DNS records match those in `docs/DNS_SETUP_QUICK.md`
- Verify that all environment variables from `docs/ENVIRONMENT.md` are set
- 24 hours after deployment, enable CSP enforcement as described in the operator runbook
