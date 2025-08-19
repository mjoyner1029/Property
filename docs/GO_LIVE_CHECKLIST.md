# Asset Anchor Go-Live Checklist

This checklist covers all steps required for deploying Asset Anchor to production at assetanchor.io.

## Pre-Launch Configuration

### DNS Configuration

- [ ] Configure DNS records for assetanchor.io (see [docs/DNS_SETUP_QUICK.md](./DNS_SETUP_QUICK.md) for exact values):
  - [ ] Set A record for apex to Vercel IP
  - [ ] Set CNAME for www to Vercel DNS
  - [ ] Set CNAME for api to Render service
  - [ ] Verify with `dig assetanchor.io +noall +answer`
  - [ ] Verify with `dig www.assetanchor.io +noall +answer`
  - [ ] Verify with `dig api.assetanchor.io +noall +answer`

### Environment Variables

- [ ] Verify backend (Render) environment variables:
  - [ ] Compare with docs/ENVIRONMENT.md
  - [ ] Check all secrets and API keys are set
  - [ ] Ensure REDIS_URL is configured
  - [ ] Set CSP_ENFORCE=false initially (will enable after testing)

- [ ] Verify frontend (Vercel) environment variables:
  - [ ] Compare with docs/ENVIRONMENT.md
  - [ ] Check API_BASE_URL is set to https://api.assetanchor.io
  - [ ] Ensure Stripe public key is set to production key

## Backend Deployment

- [ ] Deploy backend to Render:
  - [ ] Trigger deployment through GitHub Actions or Render dashboard
  - [ ] Monitor deployment logs for errors
  - [ ] Verify database migrations run successfully

- [ ] Run backend smoke tests:
  ```bash
  python scripts/smoke_test.py --url https://api.assetanchor.io
  ```

- [ ] Verify API health endpoint:
  ```bash
  curl https://api.assetanchor.io/api/health
  ```

- [ ] Test rate limiting:
  ```bash
  for i in {1..10}; do curl https://api.assetanchor.io/api/health; done
  ```

## Stripe Integration

- [ ] Verify Stripe webhook configuration:
  - [ ] Ensure webhook URL is set to https://api.assetanchor.io/api/webhooks/stripe
  - [ ] Confirm webhook has correct events subscribed

- [ ] Test Stripe webhook with test event:
  ```bash
  stripe trigger payment_intent.succeeded
  ```

- [ ] Verify webhook signature verification is working

## Frontend Deployment

- [ ] Deploy frontend to Vercel:
  - [ ] Trigger deployment through GitHub Actions or Vercel dashboard
  - [ ] Monitor deployment for errors

- [ ] Run frontend smoke tests:
  - [ ] Load https://assetanchor.io in browser
  - [ ] Verify no console errors
  - [ ] Confirm API calls succeed
  - [ ] Check for CSP violations in browser console

## End-to-End Testing

- [ ] Test landlord onboarding flow:
  - [ ] Sign up as new landlord
  - [ ] Complete profile
  - [ ] Add property
  - [ ] Connect Stripe account

- [ ] Test tenant invite flow:
  - [ ] Invite tenant via email
  - [ ] Accept invitation
  - [ ] Complete tenant profile

- [ ] Test payment processing:
  - [ ] Create payment request as landlord
  - [ ] Make payment as tenant
  - [ ] Verify payment shows in dashboard

- [ ] Test notifications:
  - [ ] Verify email notifications
  - [ ] Check in-app notifications

- [ ] Verify RBAC (Role-Based Access Control):
  - [ ] Test admin access to all features
  - [ ] Test landlord restrictions
  - [ ] Test tenant restrictions

## Observability & Monitoring

- [ ] Verify Sentry integration:
  - [ ] Confirm Sentry is only logging in production
  - [ ] Test error reporting with intentional error

- [ ] Set up UptimeRobot monitors:
  - [ ] Frontend: https://assetanchor.io
  - [ ] API: https://api.assetanchor.io/api/health

## Performance Testing

- [ ] Run Lighthouse test on frontend:
  - [ ] Verify mobile LCP < 2.5s
  - [ ] Check Core Web Vitals pass

- [ ] Test API performance:
  - [ ] Verify p95 response time < 500ms for critical endpoints

## Security Configuration

- [ ] Enable CSP enforcement:
  - [ ] Set CSP_ENFORCE=true in Render environment
  - [ ] Redeploy backend
  - [ ] Verify no legitimate CSP violations

## Backup & Maintenance

- [ ] Verify Render daily backups are enabled for database

- [ ] Create calendar reminders:
  - [ ] Monthly: Database restore tests
  - [ ] Quarterly: Secret rotation
  - [ ] Monthly: Security patches

## Rollback Plan

- [ ] Document rollback procedures in docs/RELEASES.md:
  - [ ] Backend rollback via Render dashboard
  - [ ] Frontend rollback via Vercel dashboard
  - [ ] Database rollback to previous backup

## Final Launch

- [ ] Perform final verification of all critical systems

- [ ] Announce launch to stakeholders

- [ ] Monitor systems closely for 24 hours post-launch

## CI/CD & Quality Gates

- FE tests: `npm run test:ci`
- Lighthouse: `LH_URL=http://localhost:3000 npm run lh:ci` (perf ≥ 85, a11y ≥ 90)
- BE tests: `pytest -q`
- Deploy workflow: tests → migrations → API deploy → smoke → frontend deploy
- To skip deploy: add `[skip deploy]` to your commit message

## CI/CD Secrets

### GitHub Actions Secrets
- [ ] Required for deployment pipeline:
  - [ ] RENDER_API_KEY - API key for Render service management
  - [ ] RENDER_SERVICE_ID_API - ID of the Render API service to deploy
  - [ ] RENDER_DEPLOY_HOOK_API - Alternative: Deploy hook URL if API key is not available
  - [ ] VERCEL_TOKEN - Auth token for Vercel CLI deployment
  - [ ] VERCEL_PROJECT_ID - ID of the Vercel project to deploy
  - [ ] VERCEL_ORG_ID - ID of the Vercel organization

### Render Environment Variables
- [ ] Required for backend operation:
  - [ ] DATABASE_URL - PostgreSQL connection string
  - [ ] REDIS_URL - Redis connection string for session/cache
  - [ ] STRIPE_SECRET_KEY - Stripe API key for payment processing
  - [ ] STRIPE_WEBHOOK_SECRET - Secret for verifying Stripe webhook events
  - [ ] S3_ACCESS_KEY_ID - AWS S3 credentials for file storage
  - [ ] S3_SECRET_ACCESS_KEY - AWS S3 secret
  - [ ] S3_BUCKET - S3 bucket name
  - [ ] S3_REGION - AWS region for S3 bucket
  - [ ] SENTRY_DSN - Sentry error tracking endpoint
  - [ ] APP_BASE_URL - Base URL for backend API
  - [ ] JWT_SECRET - Secret for signing JWT tokens
  - [ ] CORS_ALLOWED_ORIGINS - Frontend origins allowed to access API
  - [ ] CSP_* - Content Security Policy configuration
  - [ ] EMAIL_* - SMTP/email service provider credentials

### Vercel Environment Variables
- [ ] Required for frontend operation:
  - [ ] REACT_APP_API_URL - Backend API base URL
  - [ ] Other REACT_APP_* public variables needed for frontend operation

> **Note (August 19, 2025)**: CI workflows have been fully configured with proper test coverage and deployment pipeline. Backend tests run on SQLite with in-memory rate limiter and dummy Stripe/Sentry credentials in test mode. Frontend tests enforce 70% coverage for statements/lines/functions. The deployment pipeline ensures tests pass before triggering deployments, and deploys the backend before the frontend.
