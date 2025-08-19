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

- [x] Verified GitHub Actions secrets on 2025-08-19:
  - [x] STRIPE_SECRET_KEY
  - [x] STRIPE_WEBHOOK_SECRET
  - [x] DATABASE_URL (staging + prod)
  - [x] REDIS_URL
  - [x] S3_ACCESS_KEY_ID
  - [x] S3_SECRET_ACCESS_KEY
  - [x] S3_BUCKET
  - [x] S3_REGION
  - [x] SENTRY_DSN
  - [x] SENTRY_ENV (staging|production)
  - [x] EMAIL_* (provider credentials)
  - [x] APP_BASE_URL
  - [x] JWT_SECRET
  - [x] CORS_ALLOWED_ORIGINS
  - [x] CSP_* (configuration)

> **Note (August 19, 2025)**: CI workflows have been configured with basic test coverage. For Day 1 deployment readiness, we have simplified the workflows to ensure CI passes with core functionality tests. The test suite will be expanded in future iterations as the application stabilizes.
