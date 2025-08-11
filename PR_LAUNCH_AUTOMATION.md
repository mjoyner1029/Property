# Finalize Launch Automation for assetanchor.io

This PR finalizes the automated launch pipeline and verification processes for Asset Anchor's production deployment at assetanchor.io.

## Files Changed

### CI/CD Workflows
- `.github/workflows/predeploy-prod.yml`: Fixed parameter name for smoke tests (--base-url)
- `.github/workflows/backend-deploy.yml`: Updated post-deploy verification to use consistent parameter
- `.github/workflows/frontend-deploy.yml`: No changes needed, correctly set up

### Documentation
- `docs/OPERATOR_CUTOVER.md`: New file with comprehensive cutover instructions
- `docs/GO_LIVE_CHECKLIST.md`: No changes needed, already comprehensive
- `docs/DNS_SETUP_QUICK.md`: No changes needed, contains correct DNS records
- `docs/RELEASES.md`: No changes needed, already has rollback instructions

### Scripts
- Made all scripts executable:
  - `scripts/smoke_test.py`
  - `scripts/check_frontend.mjs`
  - `scripts/tag_release.sh`

## Deployment Pipeline

The updated deployment pipeline now follows these steps:
1. Pre-deploy smoke tests run against current production API
2. If tests pass, backend is deployed to Render
3. Database migrations run automatically
4. Post-deploy verification ensures new API deployment is working
5. Frontend workflow is triggered by backend deployment
6. Frontend is deployed to Vercel
7. Frontend verification checks site access and API connectivity

## Operator Checklist

- [ ] Configure DNS records as specified in `docs/DNS_SETUP_QUICK.md`
- [ ] Set environment variables in Render dashboard
- [ ] Set environment variables in Vercel dashboard
- [ ] Configure Stripe webhook endpoint
- [ ] Merge this PR to trigger automated deployment
- [ ] Monitor deployment progress in GitHub Actions
- [ ] Verify site is accessible at https://assetanchor.io
- [ ] Run optional Stripe webhook test (see `scripts/stripe_webhook_check.md`)
- [ ] After 24 hours with no issues, enable CSP enforcement (update to `CSP_ENFORCE=true`)
- [ ] Tag the release with `scripts/tag_release.sh v1.0.0`

## Manual Dashboard Steps

After merging this PR, you'll need to:

1. **Render Dashboard**:
   - Confirm all environment variables are set
   - Monitor deployment progress

2. **Vercel Dashboard**:
   - Confirm all environment variables are set
   - Monitor deployment progress

3. **DNS Provider**:
   - Verify all DNS records are configured correctly

4. **Stripe Dashboard**:
   - Confirm webhook endpoint is set to https://api.assetanchor.io/api/webhooks/stripe
