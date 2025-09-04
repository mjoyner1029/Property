# Deployment Smoke Tests

This document provides concise commands and URLs to verify a fresh deployment of the Property platform.

## Backend Checks

### Health Endpoints

```bash
# Check Kubernetes health probes
curl https://api.assetanchor.com/healthz
curl https://api.assetanchor.com/readyz

# Check API health
curl https://api.assetanchor.com/api/health
```

Expected response from `/api/health`:
```json
{
  "status": "healthy",
  "version": "1.x.x",
  "services": {
    "database": "up",
    "redis": "up"
  }
}
```

### Sentry Integration Test

Use the built-in script to test Sentry error reporting:

```bash
# From repo root
export API_URL=https://api.assetanchor.com
python scripts/quick_test_sentry.py
```

Or trigger a test error directly:
```bash
curl -v https://api.assetanchor.com/debug-sentry
```

Expected response: `500 Internal Server Error` (this is intentional)

## Frontend Checks

### Basic Login Flow

1. Visit https://app.assetanchor.com
2. Login with test credentials (admin@example.com / use deployment password)
3. Verify dashboard loads with property listings

### Frontend Environment Variables (Vercel)

Navigate to: https://vercel.com/mjoyner1029/asset-anchor/settings/environment-variables

Required variables:
- `REACT_APP_API_URL`: https://api.assetanchor.com
- `REACT_APP_SENTRY_DSN`: [Your Sentry DSN]
- `REACT_APP_STRIPE_PUBLIC_KEY`: [Your Stripe public key]

## Render Configuration

### Service Logs

View backend logs:
https://dashboard.render.com/web/srv-xxxx/logs

### Environment Secrets

Set sensitive environment variables:
https://dashboard.render.com/web/srv-xxxx/env

Required secrets:
- `DATABASE_URL`: [PostgreSQL connection string]
- `REDIS_URL`: [Redis connection string]
- `SECRET_KEY`: [Flask secret key]
- `STRIPE_SECRET_KEY`: [Stripe API key]
- `SENTRY_DSN`: [Sentry DSN]

## Database Migrations

Verify migrations ran successfully:

```bash
# SSH into the backend service
ssh asset-anchor-api

# Check migration history
python -m flask db history
```

The migrations should match those in `/Users/mjoyner/Property/backend/migrations/versions/`.

## Full End-to-End Test

1. Login to https://app.assetanchor.com
2. Create a new property
3. Add a tenant to the property
4. Create a maintenance request
5. Verify notification appears

## Common Issues and Troubleshooting

- **Database connection errors**: Verify `DATABASE_URL` in Render environment variables
- **Redis connection issues**: Check `REDIS_URL` format and connectivity
- **Missing Sentry events**: Ensure `SENTRY_DSN` is properly set on both frontend and backend
- **Stripe integration fails**: Verify both public and secret keys are correctly configured

For additional troubleshooting, run the day2 tests:

```bash
cd scripts
./run_day2_tests.sh
```

This will verify core functionality is working as expected.
