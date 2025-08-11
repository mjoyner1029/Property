# Asset Anchor Operator Runbook

This document serves as an operator's guide for managing, maintaining, and troubleshooting the Asset Anchor application in production.

## Service Architecture

Asset Anchor consists of:
- **Frontend**: React application hosted on Vercel
- **Backend**: Flask API hosted on Render
- **Database**: PostgreSQL managed by Render
- **Cache**: Redis managed by Render
- **Email**: Postmark for transactional emails
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
- **Backend**: `/health` endpoint monitored by UptimeRobot
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

Manual deployment (if needed):
```bash
# Trigger deploy from Render dashboard
# Or use Render CLI if available
```

### Database Migrations

Migrations are automatically run during deployment by the migration job defined in `render.yaml`.

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

## Troubleshooting

### Common Issues

#### Frontend Issues

1. **Blank Screen / Loading Errors**:
   - Check Vercel deployment logs
   - Verify API endpoints are accessible
   - Check browser console for JavaScript errors
   - Verify environment variables are correctly set

2. **Authentication Issues**:
   - Verify JWT_SECRET is consistent
   - Check token expiration settings
   - Verify CORS settings

#### Backend Issues

1. **API 5xx Errors**:
   - Check Render logs for backend service
   - Verify database connectivity
   - Check for recent code deployments that might cause issues

2. **Slow Response Times**:
   - Check database query performance
   - Verify Redis connectivity
   - Check for high resource utilization in Render dashboard

#### Database Issues

1. **Connection Errors**:
   - Verify database is running in Render dashboard
   - Check connection string environment variables
   - Verify network access between backend and database

2. **Performance Issues**:
   - Check for long-running queries
   - Verify indexes are properly configured
   - Consider scaling up database if needed

### Diagnostic Commands

#### Check Backend Health

```bash
curl https://api.assetanchor.io/health
```

Expected response:
```json
{
  "status": "healthy",
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
