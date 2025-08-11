# Asset Anchor Operator Runbook

This runbook provides common operational commands and procedures for managing Asset Anchor in production.

## Database Management

### Run Database Migrations

To run migrations manually:

```bash
# Set DATABASE_URL environment variable if not already set
export DATABASE_URL="postgres://user:password@host:port/database"

# Run migrations
cd backend
flask db upgrade

# Or use the migration script
bash scripts/run_migrations.sh
```

### Run One-Off Migration Command

For custom migration tasks:

```bash
# Connect to database
psql $DATABASE_URL

# Or run SQL directly
psql $DATABASE_URL -c "SELECT * FROM alembic_version;"
```

### Database Backup

```bash
# Manual backup (if using PostgreSQL)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Security Management

### Generate Production Secrets

```bash
# Generate new secure random keys
bash scripts/generate_secrets.sh

# This will output:
# SECRET_KEY=<long-random-string>
# JWT_SECRET_KEY=<long-random-string>
```

### Content Security Policy Management

```bash
# Initially, CSP is in report-only mode (CSP_ENFORCE=false)
# After 24 hours of monitoring for CSP violations, enable enforcement:

# 1. Update Render environment variable:
# CSP_ENFORCE=true

# 2. Deploy application or restart service to apply changes
```

### Rotate Secrets

```bash
# 1. Generate new secrets
bash scripts/generate_secrets.sh

# 2. Update in Render environment variables
# 3. Deploy application with new secrets
```

## Testing & Verification

### Run Backend Tests

```bash
# Run all tests
cd backend
pytest

# Run with coverage report
pytest --cov=src
```

### Run API Smoke Tests

```bash
# Test local development API
python scripts/smoke_test.py --url http://localhost:5050

# Test production API
python scripts/smoke_test.py --url https://api.assetanchor.io
```

### Check API Health

```bash
# Local development
curl http://localhost:5050/api/health

# Production
curl https://api.assetanchor.io/api/health
```

### Verify Environment Variables

```bash
# Check environment variables
python scripts/check_env.py
```

## Deployment Management

### Trigger Backend Deployment

```bash
# Using Render API
curl -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys"
```

### Rollback to Previous Deployment

#### Backend (Render)

1. Go to Render Dashboard > asset-anchor-api service
2. Navigate to "Deploys" tab
3. Find the last successful deployment
4. Click "..." > "Rollback to this deploy"

#### Frontend (Vercel)

1. Go to Vercel Dashboard > Asset Anchor project
2. Navigate to "Deployments" tab
3. Find the last successful deployment
4. Click on the deployment and select "Promote to Production"

## Monitoring & Troubleshooting

### Check Logs

```bash
# View backend logs
# Access via Render dashboard or:
curl -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID/logs"

# View frontend logs via Vercel dashboard
```

### Check Database Status

```bash
# Connect to database and check status
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

### Redis Cache Management

```bash
# Connect to Redis
redis-cli -u $REDIS_URL

# Clear rate limiting cache
redis-cli -u $REDIS_URL FLUSHDB
```

## CSP Management

To enable or disable CSP enforcement:

1. Go to Render Dashboard > Environment Variables
2. Set `CSP_ENFORCE=true` to enforce CSP
3. Set `CSP_ENFORCE=false` to use report-only mode
4. Redeploy the backend application

## Recovery Procedures

### Database Recovery

```bash
# Restore from backup
pg_restore -d $DATABASE_URL backup_file.sql
```

### Complete Service Restore

In case of catastrophic failure:

1. Restore database from latest backup
2. Deploy backend services with correct configuration
3. Deploy frontend with correct configuration
4. Verify functionality with test transactions
5. Monitor closely for 24 hours post-recovery
