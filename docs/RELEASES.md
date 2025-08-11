# Asset Anchor Release & Rollback Procedures

This document outlines the procedures for releasing updates to the Asset Anchor application and rolling back in case of issues.

## Release Process

### 1. Pre-Release Checklist

- [ ] All automated tests pass
- [ ] Manual testing completed on staging environment
- [ ] Database migrations tested
- [ ] Feature flags configured (if applicable)
- [ ] Documentation updated
- [ ] Performance impacts assessed

### 2. Release Planning

- Schedule releases during low-traffic periods
- Notify stakeholders at least 24 hours in advance
- Prepare rollback plan specific to the release
- Review monitoring dashboards prior to release

### 3. Release Procedure

#### Backend (Render)

1. **Deploy backend services**:
   ```bash
   # Via GitHub Actions (preferred)
   git push origin main
   
   # Or manually via Render API
   curl -X POST \
     -H "Authorization: Bearer $RENDER_API_KEY" \
     -H "Content-Type: application/json" \
     "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys"
   ```

2. **Run database migrations**:
   ```bash
   # Via GitHub Actions (preferred)
   # This is automatically triggered after successful backend deployment
   
   # Or manually via Render API
   curl -X POST \
     -H "Authorization: Bearer $RENDER_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"serviceId": "$RENDER_MIGRATIONS_SERVICE_ID"}' \
     "https://api.render.com/v1/jobs"
   ```

3. **Verify backend deployment**:
   ```bash
   # Check API health
   curl https://api.assetanchor.io/api/health
   
   # Run smoke tests
   python scripts/smoke_test.py --url https://api.assetanchor.io
   ```

#### Frontend (Vercel)

1. **Deploy frontend services**:
   ```bash
   # Via GitHub Actions (preferred)
   git push origin main
   
   # Or manually via Vercel CLI
   cd frontend
   vercel --prod
   ```

2. **Verify frontend deployment**:
   - Load https://assetanchor.io in browser
   - Check for console errors
   - Verify API integration works
   - Test critical user flows

### 4. Post-Release Monitoring

- Monitor error rates for 24 hours
- Watch for performance degradation
- Check for unusual database load
- Monitor user feedback channels

## Rollback Procedures

If issues are detected after deployment, follow these rollback procedures.

### Backend Rollback

#### 1. Render Dashboard Rollback (Preferred Method)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Navigate to `asset-anchor-api` service
3. Go to "Deploys" tab
4. Find the last known good deployment
5. Click the menu button (three dots) and select "Rollback to this deploy"
6. Wait for rollback to complete and verify health

**Quick Rollback Command:**
To quickly rollback to the last green build:
```bash
# Get the service ID
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

#### 2. Manual API Rollback

```bash
# Get list of deployments
curl -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys"

# Trigger rollback to specific deployment
curl -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"deployID": "dep-xxxxxxxxxxxxx"}' \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID/rollback"
```

#### 3. Database Rollback

If database migrations need to be reverted:

```bash
# Connect to database
export DATABASE_URL="postgres://user:password@host:port/database"

# Downgrade to previous migration version
cd backend
flask db downgrade
```

### Frontend Rollback

#### 1. Vercel Dashboard Rollback (Preferred Method)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Asset Anchor project
3. Go to "Deployments" tab
4. Find the last known good deployment
5. Click on the deployment
6. Select "..." > "Promote to Production"
7. Confirm the rollback

**Quick Rollback Command:**
To quickly rollback to the previous deployment:
```bash
vercel rollback --scope assetanchor
```

#### 2. Manual CLI Rollback

```bash
# List deployments
vercel ls asset-anchor

# Promote specific deployment to production
vercel promote asset-anchor@deployment-url
```

### Emergency Rollback

In critical situations requiring immediate action:

1. **Backend**: Use Render dashboard to roll back to last known good deployment
2. **Frontend**: Use Vercel dashboard to roll back to last known good deployment
3. **Notify stakeholders** about the emergency rollback
4. **Document the incident** for post-mortem analysis

## Feature Flags

Where possible, use feature flags to enable safer deployments:

1. Deploy code with new features disabled by default
2. Enable features gradually after verifying deployment stability
3. If issues occur, disable features without requiring code rollback

## Release Versioning

Asset Anchor uses semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Incompatible API changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Deployment Artifacts

For each production release:

1. Tag the Git repository with the version number
2. Document changes in the release notes
3. Archive deployment artifacts for audit purposes

## Post-Incident Review

After any rollback:

1. Conduct a post-mortem analysis
2. Document root causes and corrective actions
3. Update procedures to prevent similar issues
