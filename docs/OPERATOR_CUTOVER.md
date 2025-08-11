# Asset Anchor Operator Cutover Guide

This document provides the exact sequence for deploying Asset Anchor to production at assetanchor.io.

## Pre-Cutover Checklist

- [ ] Confirm DNS records are configured per `docs/DNS_SETUP_QUICK.md`
- [ ] Verify all environment variables are set in Render and Vercel dashboards
- [ ] Ensure you have access to Render and Vercel dashboards
- [ ] Confirm Stripe API keys and webhook secrets are configured
- [ ] Check that Redis is provisioned and REDIS_URL is configured

## Cutover Sequence

1. **Merge the PR to main branch**
   ```bash
   git checkout main
   git pull
   git merge <feature-branch>
   git push origin main
   ```

2. **Monitor CI/CD Pipeline**
   - GitHub Actions will automatically run:
     1. Pre-deploy smoke tests (baseline verification)
     2. Backend deployment to Render
     3. Database migrations
     4. Post-deploy API smoke tests
     5. Frontend deployment to Vercel
     6. Frontend verification checks

3. **Verify Deployment**
   ```bash
   # Verify API health
   python scripts/smoke_test.py --base-url https://api.assetanchor.io
   
   # Verify frontend
   node scripts/check_frontend.mjs
   
   # Optional: Test Stripe webhooks
   # Follow instructions in scripts/stripe_webhook_check.md
   ```

4. **Post-Cutover Steps**
   - Monitor error rates in Sentry for 24 hours
   - After 24 hours with no CSP violations, enable CSP enforcement:
     - Update `CSP_ENFORCE=true` in Render environment
   - Tag the release:
     ```bash
     ./scripts/tag_release.sh v1.0.0
     git push origin v1.0.0
     ```

## Rollback Procedure

If issues are detected after deployment, follow these rollback steps:

### Backend Rollback
```bash
# Quick rollback to last green build
RENDER_SERVICE_ID=$RENDER_BACKEND_SERVICE_ID

# Find the last successful deploy
LAST_GOOD_DEPLOY=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys?limit=10" | \
  jq '.[] | select(.status=="live") | .id' | head -2 | tail -1 | tr -d '"')

# Rollback to that deploy
curl -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"deployID\": \"$LAST_GOOD_DEPLOY\"}" \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID/rollback"
```

### Frontend Rollback
```bash
# Quick rollback to previous deployment
vercel rollback --scope assetanchor
```

### Database Rollback (if needed)
```bash
# Downgrade database by one version
cd backend
flask db downgrade
```

## External Dashboard Actions Required

- **Render Dashboard**: Set environment variables
- **Vercel Dashboard**: Set environment variables
- **DNS Provider**: Configure DNS records
- **Stripe Dashboard**: Set webhook endpoint to https://api.assetanchor.io/api/webhooks/stripe
