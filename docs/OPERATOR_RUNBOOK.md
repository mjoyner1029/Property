# Asset Anchor Operator Runbook

This document serves as an operator's guide for managing, maintaining, and troubleshooting the Asset Anchor application in production.

## Service Architecture

Asset Anchor consists of:
- **Frontend**: React application hosted on Vercel
- **Backend**: Flask API hosted on Render
- **Database**: PostgreSQL managed by Render
- **Cache**: Redis managed by Render
- **Email**: Postmark for5. Review and audit access logs
6. Enable additional authentication factors

## Performance Tuning Guide

### Database Optimization

#### PostgreSQL Tuning

1. **Connection Pooling**
   - Configure PgBouncer in Render for optimal connection management
   - Recommended settings:
     ```
     pool_mode = transaction
     max_client_conn = 500
     default_pool_size = 20
     ```

2. **Index Optimization**
   - Run the following query to identify missing indexes:
     ```sql
     SELECT 
       schemaname || '.' || relname as table,
       indexrelname as index,
       pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
       idx_scan as index_scans
     FROM pg_stat_user_indexes
     ORDER BY pg_relation_size(indexrelid) DESC;
     ```
   - Add indexes for frequently queried columns

3. **Query Optimization**
   - Use EXPLAIN ANALYZE to identify slow queries
   - Common optimization targets:
     - Property search queries
     - User dashboard aggregations
     - Report generation queries

#### Redis Cache Configuration

1. **Cache TTL Settings**
   - Property data: 10 minutes
   - User preferences: 1 hour
   - Static content: 24 hours

2. **Monitoring Redis Memory**
   ```bash
   redis-cli --stat
   redis-cli info memory
   ```

3. **Implementing Cache Invalidation**
   - After property updates: `DEL property:{id}`
   - After user profile changes: `DEL user:{id}:preferences`

### API Optimization

1. **Response Compression**
   - Verify gzip compression is enabled:
     ```python
     # Should be enabled in app.py
     from flask_compress import Compress
     compress = Compress()
     compress.init_app(app)
     ```

2. **Pagination Implementation**
   - All list endpoints should use pagination
   - Default page size: 20 items
   - Maximum page size: 100 items

3. **Request Rate Limiting**
   - Adjust in `config.py`:
     ```python
     # Requests per minute by endpoint
     RATE_LIMIT_DEFAULT = 60
     RATE_LIMIT_AUTH = 10
     RATE_LIMIT_SEARCH = 30
     ```

### Frontend Optimization

1. **Bundle Size Reduction**
   - Run webpack bundle analyzer:
     ```bash
     cd frontend
     npm run analyze
     ```
   - Look for large dependencies that can be code-split

2. **Image Optimization**
   - Use responsive images with srcset
   - Implement lazy loading for below-fold images
   - Consider using next-gen formats (WebP, AVIF)

3. **Core Web Vitals Monitoring**
   - Monitor in Google Search Console
   - Recommended targets:
     - LCP: < 2.5s
     - FID: < 100ms
     - CLS: < 0.1

## Maintenance Procedures

### Scheduled Maintenance Windows

| Environment | Preferred Window | Backup Window | Notification Lead Time |
|-------------|------------------|--------------|------------------------|
| Production | Sunday 2:00 AM - 5:00 AM EST | Wednesday 1:00 AM - 3:00 AM EST | 72 hours |
| Staging | Tuesday 11:00 AM - 1:00 PM EST | Any business day | 24 hours |
| Development | Any time | N/A | None |

### Pre-Maintenance Checklist

1. **Communication**
   - [ ] Schedule maintenance in team calendar
   - [ ] Draft customer notification email
   - [ ] Update status page with planned maintenance
   - [ ] Notify internal stakeholders

2. **Preparation**
   - [ ] Create maintenance plan document
   - [ ] Review rollback procedures
   - [ ] Verify current database backups
   - [ ] Run `scripts/pre-deploy-check.sh` to confirm system health

3. **Testing**
   - [ ] Verify maintenance procedure in staging environment
   - [ ] Test rollback procedure
   - [ ] Update maintenance runbook with any new findings

### Maintenance Execution Process

1. **T-15 Minutes**
   - Enable maintenance mode banner on website
   - Post update to status page
   - Ensure all team members are available on designated chat channel

2. **Maintenance Start**
   - Enable full maintenance mode (if required)
   - Take database snapshot
   - Begin scheduled work

3. **During Maintenance**
   - Post progress updates to status page every 30 minutes
   - Document any unexpected issues
   - Make go/no-go decisions for complex changes

4. **Maintenance Completion**
   - Run smoke tests to verify functionality
   - Disable maintenance mode
   - Update status page
   - Send completion notification

### Common Maintenance Procedures

#### Database Schema Updates

```bash
# Take pre-migration snapshot
./scripts/run_migrations.sh --backup

# Run migrations
./scripts/run_migrations.sh

# Verify migrations succeeded
./scripts/run_migrations.sh --verify

# If failure, rollback
./scripts/run_migrations.sh --rollback
```

#### Scaling Resources

1. **Vertical Scaling (Render)**
   - Go to Render Dashboard > Service > Settings
   - Change instance type
   - Click "Save Changes" to apply (causes brief restart)

2. **Horizontal Scaling (Render)**
   - Go to Render Dashboard > Service > Settings
   - Adjust number of instances
   - Click "Save Changes" to apply

3. **Database Scaling**
   - Plan for 15-30 minutes of potential downtime
   - Go to Render Dashboard > Database > Settings
   - Select new plan
   - Confirm upgraderansactional emails
- **Storage**: AWS S3 for file storage
- **Payments**: Stripe for payment processing

## Access Management

### Production Environment Access

| Resource | Access Method | Required Permissions | Notes |
|----------|---------------|----------------------|-------|
| Vercel | Vercel Dashboard | Team Member or Admin | For frontend deployment |
| Render | Render Dashboard | Team Member or Admin | For backend services |
| AWS Console | IAM User/Role | S3 permissions | For storage management |
| Postmark | Postmark Dashboard | Account Access | For email management |
| Stripe | Stripe Dashboard | Account Access | For payment management |
| GitHub | Repository Access | Write or Admin | For code deployments |

### Credential Rotation Procedure

1. **JWT Secret**: Update in Render Environment Variables
   ```
   # Generate new secret
   openssl rand -hex 32
   
   # Update in Render env vars, then deploy
   ```

2. **Database Credentials**: 
   - Use Render Dashboard to reset database password
   - Update password in Render environment variables for the backend service

3. **AWS IAM Keys**:
   - Create new access keys in AWS IAM console
   - Update keys in Render environment variables
   - Verify functionality
   - Delete old keys from AWS IAM console

## Monitoring & Alerting

### Health Checks

- **Frontend**: Vercel monitors deployment health
- **Backend**: `/api/health` endpoint monitored by UptimeRobot
- **Database**: Render provides database monitoring

### Alerts Configuration

- **Response Time**: Alert if p95 > 1000ms
- **Error Rate**: Alert if error rate > 1% of requests
- **Database**: Alert on high CPU/memory usage
- **Disk Space**: Alert at 85% capacity

### Log Access

- **Backend Logs**: Available in Render Dashboard
- **Frontend Logs**: Available in Vercel Dashboard
- **Application Errors**: Tracked in Sentry
- **Database Logs**: Available in Render Database Dashboard

## Common Operations

### Deployment

#### Frontend Deployment

Frontend deployment is automated via GitHub actions. When code is merged to the main branch, it is automatically deployed to Vercel.

Manual deployment:
```bash
# From local environment
vercel --prod
```

#### Backend Deployment

Backend deployment is automated via GitHub actions. When code is merged to the main branch, it is automatically deployed to Render.

Deployment sequence:
1. Database migrations run first via Render job ID: `srv-xyz123` (migrations)
2. API service is deployed via Render service ID: `srv-abc456` (API)
3. Smoke tests run to verify API is healthy
4. Frontend deployment is triggered after successful API deployment

Manual deployment via Render API:
```bash
# Run migrations
curl -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/jobs/$RENDER_JOB_ID_MIGRATIONS/runs"

# Deploy API service
curl -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID_API/deploys" \
  -d '{"clearCache":false}'
```

### Database Migrations

Migrations are automatically run during deployment by the Render job defined in GitHub Actions workflows.

To run migrations manually:
```bash
# Set up environment
export DATABASE_URL="postgres://user:password@host:port/database"

# Run migrations
make db-upgrade
```

To rollback a migration:
```bash
# Roll back one migration
make db-downgrade
```

### Scaling

#### Frontend Scaling

Vercel automatically scales the frontend based on traffic.

#### Backend Scaling

To scale the backend service:
1. Go to Render Dashboard
2. Select the Asset Anchor backend service
3. Under Settings > Instance Type, adjust the instance type
4. For horizontal scaling, increase the number of instances

### Backup & Restore

#### Database Backup

Render automatically takes daily backups of the database.

To create a manual backup:
1. Go to Render Dashboard > Databases
2. Select Asset Anchor database
3. Click "Create Manual Backup"

#### Database Restore

To restore from a backup:
1. Go to Render Dashboard > Databases
2. Select Asset Anchor database
3. Navigate to Backups tab
4. Select the backup to restore from
5. Click "Restore"

## Incident Response

### Incident Severity Levels

| Severity | Description | Initial Response Time | Communication | Example |
|----------|-------------|------------------------|---------------|---------|
| P1 | Critical service outage | 15 min | Every hour | Complete API outage |
| P2 | Major functionality broken | 30 min | Every 2 hours | Payment processing down |
| P3 | Minor functionality issue | 4 hours | Daily | Non-critical feature unavailable |
| P4 | Cosmetic issues | 24 hours | Weekly | UI alignment issues |

### Incident Response Process

1. **Detection**
   - Monitor Sentry alerts and Prometheus dashboards
   - Receive user/customer reports
   - Automated alerts from health checks

2. **Triage**
   - Determine severity level
   - Assign incident owner
   - Create incident channel in Slack (#incident-YYYYMMDD-description)

3. **Investigation**
   - Gather logs (Render, Vercel, Sentry)
   - Check recent deployments
   - Investigate system metrics

4. **Mitigation**
   - Apply temporary fixes if possible
   - Consider rollback to last known good version
   - Update status page

5. **Resolution**
   - Deploy permanent fix
   - Verify functionality
   - Update documentation

6. **Post-Mortem**
   - Document root cause
   - Identify preventative measures
   - Update runbooks and playbooks

### Communication Templates

#### Customer Communication

```
Subject: [SEVERITY] Asset Anchor Service Update

Dear Asset Anchor Customer,

We're currently experiencing [brief description of issue] affecting [specific functionality]. 
Our engineering team has been alerted and is actively working to resolve this issue.

Current Status: [Investigating/Identified/Mitigating/Resolved]

Estimated Resolution Time: [time or "under investigation"]

We'll provide an update [timeframe based on severity].

We apologize for any inconvenience this may cause.

The Asset Anchor Team
```

## Troubleshooting

### Common Issues

#### Frontend Issues

1. **Blank Screen / Loading Errors**:
   - Check Vercel deployment logs
   - Verify API endpoints are accessible
   - Check browser console for JavaScript errors
   - Verify environment variables are correctly set
   - Run `npm run build` locally to verify build succeeds

2. **Authentication Issues**:
   - Verify JWT_SECRET is consistent
   - Check token expiration settings
   - Verify CORS settings
   - Use browser developer tools to inspect JWT tokens

#### Backend Issues

1. **API 5xx Errors**:
   - Check Render logs for backend service
   - Verify database connectivity
   - Check for recent code deployments that might cause issues
   - Run health check endpoint (/api/health) to verify service status
   - Check for memory/CPU spikes in Render dashboard

2. **Slow Response Times**:
   - Check database query performance
   - Verify Redis connectivity
   - Check for high resource utilization in Render dashboard
   - Run `scripts/pre-deploy-check.sh` to verify performance

#### Database Issues

1. **Connection Errors**:
   - Verify database is running in Render dashboard
   - Check connection string environment variables
   - Verify network access between backend and database
   - Check max connections setting

2. **Performance Issues**:
   - Check for long-running queries
   - Review query plans for common operations
   - Check index usage statistics

### Emergency Rollback Procedures

#### Frontend Rollback

1. Go to Vercel Dashboard > Project > Deployments
2. Find the last known good deployment
3. Click on the three dots menu and select "Promote to Production"
4. Verify the rollback resolves the issue

```bash
# Alternatively, you can roll back using Vercel CLI
vercel rollback --environment=production
```

#### Backend Rollback

1. Go to Render Dashboard > Web Service > Asset Anchor API
2. Click on "Manual Deploy" > "Deploy previous build"
3. Select the last known good build
4. Monitor the rollback deployment logs
5. Verify functionality after rollback completes

#### Database Rollback

1. Go to Render Dashboard > Databases > Asset Anchor Database
2. Navigate to Backups tab
3. Select the appropriate backup point (before issue)
4. Click "Restore" and confirm
5. **Warning**: This will replace all current data with backup data

#### Code Rollback (Emergency Hot Fix)

```bash
# Checkout the last known good commit
git checkout [COMMIT_HASH]

# Create a hotfix branch
git checkout -b hotfix/emergency-[YYYY-MM-DD]

# Push the hotfix
git push origin hotfix/emergency-[YYYY-MM-DD]

# Deploy the hotfix through CI/CD or manual deployment
```

### Data Recovery Procedures

#### Recovering Deleted Data

1. Identify the data that needs to be restored
2. Determine if a point-in-time recovery is needed:
   - For individual records: Use audit logs in the application
   - For larger datasets: Consider database restore to staging
3. For S3 data:
   - Check S3 versioning (if enabled)
   - Restore previous versions as needed

```bash
# Example of restoring a previous S3 object version
aws s3api restore-object --bucket asset-anchor-prod \
  --key path/to/object \
  --version-id [VERSION_ID] \
  --restore-request '{}'
```

#### Handling Corrupted Data

1. Identify the extent of corruption
2. Isolate affected systems/features
3. Restore from last known good backup
4. Implement data validation checks
5. Document incident for future prevention

## Security Incident Response

### Reporting a Security Incident

Security incidents should be reported immediately to:
- Security Team: security@example.com
- CTO/Head of Engineering
- On-call engineer via PagerDuty

### Security Incident Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| Critical | Data breach, unauthorized access | Immediate | Customer PII exposed |
| High | Vulnerability with exploitation risk | 4 hours | Zero-day in dependency |
| Medium | Security misconfiguration | 24 hours | Improper CORS settings |
| Low | Informational findings | 72 hours | Outdated TLS version warning |

### Security Incident Response Process

1. **Identification & Containment**
   - Identify the scope and impact of the incident
   - Isolate affected systems where possible
   - Revoke compromised credentials
   - Block malicious IPs or user agents

2. **Investigation**
   - Preserve evidence and logs
   - Document timeline of events
   - Identify entry points and extent of access
   - Determine if PII/sensitive data was exposed

3. **Remediation**
   - Patch vulnerabilities
   - Rotate all potentially affected credentials
   - Remove unauthorized access
   - Restore from clean backups if needed

4. **Notification**
   - Legal team for compliance requirements
   - Customers (as required by law or contracts)
   - Law enforcement (if appropriate)
   - Regulators (as required)

5. **Post-Incident**
   - Detailed post-mortem analysis
   - Security control improvements
   - Team training updates
   - Documentation updates

### Common Security Playbooks

#### Credential Exposure

1. Immediately rotate exposed credentials:
   ```bash
   # Example: Rotate AWS keys
   aws iam create-access-key --user-name AssetAnchorProdUser
   aws iam delete-access-key --user-name AssetAnchorProdUser --access-key-id [EXPOSED_KEY_ID]
   
   # Update in Render environment
   # Update in GitHub Secrets
   ```

2. Check access logs for unauthorized usage
3. Enable additional monitoring for affected systems

#### Unauthorized Access

1. Lock affected user accounts
2. Revoke active sessions
3. Implement IP blocks if pattern detected
4. Review and audit access logs
5. Enable additional authentication factors
   - Verify indexes are properly configured
   - Consider scaling up database if needed

### Diagnostic Commands

#### Check Backend Health

```bash
curl https://api.assetanchor.io/api/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "1.x.x",
  "database": "connected",
  "redis": "connected"
}
```

#### Check Database Connectivity

```bash
# Using the database URL from environment
psql $DATABASE_URL -c "SELECT 1;"
```

#### Verify Email Sending

```bash
# Using the Postmark API token
curl -X POST "https://api.postmarkapp.com/email" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Postmark-Server-Token: $POSTMARK_API_TOKEN" \
  -d '{
    "From": "support@assetanchor.io",
    "To": "test@example.com",
    "Subject": "Test Email",
    "TextBody": "This is a test email."
  }'
```

### Incident Response

1. **Assess Impact**:
   - Determine affected services and users
   - Check monitoring dashboards for anomalies

2. **Mitigate**:
   - For frontend issues, consider rolling back to last working deployment
   - For backend issues, check logs and consider scaling or restarting service
   - For database issues, check for connection problems or high load

3. **Communicate**:
   - Update status page if available
   - Inform stakeholders of issue and ETA for resolution

4. **Resolve and Document**:
   - Implement fix
   - Document root cause and solution
   - Schedule post-mortem if necessary

## Maintenance Procedures

### Scheduled Maintenance

1. **Announce maintenance window** at least 48 hours in advance
2. **Update status page** with maintenance information
3. **Perform maintenance** during low-traffic period
4. **Verify all services** are operational after maintenance
5. **Update status page** to indicate maintenance is complete

### Security Patching

1. **Monitor security advisories** for all components
2. **Test patches** in staging environment
3. **Deploy patches** during scheduled maintenance or immediately for critical vulnerabilities
4. **Document all security updates** applied

## Disaster Recovery

### Recovery Point Objective (RPO)

Asset Anchor targets an RPO of 24 hours, with daily backups of all data.

### Recovery Time Objective (RTO)

Asset Anchor targets an RTO of 4 hours for full service restoration.

### Recovery Procedure

1. **Assess damage** and determine recovery strategy
2. **Restore database** from latest backup
3. **Deploy backend services** with correct configuration
4. **Deploy frontend** with correct configuration
5. **Verify functionality** with test transactions
6. **Monitor closely** for 24 hours post-recovery

## Contact Information

| Role | Contact | Responsibilities |
|------|---------|------------------|
| Primary On-Call | oncall@assetanchor.io | First responder for all issues |
| Backend Lead | backend-lead@assetanchor.io | Escalation for backend issues |
| Frontend Lead | frontend-lead@assetanchor.io | Escalation for frontend issues |
| Database Admin | db-admin@assetanchor.io | Escalation for database issues |
| Security Team | security@assetanchor.io | Security incidents and vulnerabilities |

## Appendices

### Environment Variables

Refer to `/docs/ENVIRONMENT.md` for a complete list of environment variables and their descriptions.

### Service Dependencies

- **Frontend**: Depends on Backend API
- **Backend**: Depends on Database, Redis, AWS S3, Postmark, Stripe
- **Database**: Standalone (managed by Render)
- **Redis**: Standalone (managed by Render)

### Monitoring Dashboards

- **Application Performance**: Sentry
- **Infrastructure**: Render Dashboard
- **Uptime Monitoring**: UptimeRobot
- **Error Tracking**: Sentry

## CI/CD & Quality Gates

### Frontend (React)
- Run all tests and check coverage:
  ```bash
  npm run test:ci
  ```
- Run Lighthouse performance & accessibility check (must meet thresholds: perf ≥ 85, a11y ≥ 90):
  ```bash
  LH_URL=http://localhost:3000 npm run lh:ci
  ```

### Backend (Flask)
- Run all tests:
  ```bash
  pytest -q
  ```

### Deploy Workflow Sequence
- Deploys are blocked unless all tests and Lighthouse pass in CI.
- Deploy pipeline (see `.github/workflows/deploy.yml`):
  1. Wait for tests to pass
  2. Run DB migrations (Render job, TODO: API call)
  3. Deploy API (Render, TODO: API call)
  4. Smoke test API (`python scripts/smoke_test.py --base-url https://api.assetanchor.io`)
  5. Deploy frontend (Vercel, TODO: vercel deploy)
- To force-skip deploy, add `[skip deploy]` to your commit message.

## Branch Protection

- Protect the `main` branch in GitHub settings.
- Require status checks: `frontend-tests`, `backend-tests` (and optionally `deploy` for visibility).
- To skip deploy for a commit, add `[skip deploy]` to the commit message.
