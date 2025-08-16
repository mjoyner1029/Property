# Asset Anchor Deployment Strategy

This document outlines the deployment strategy for the Asset Anchor application, covering environments, deployment processes, rollback procedures, and best practices.

## Deployment Environments

### Environment Matrix

| Environment | Purpose | URL | Access | Auto-deployment |
|-------------|---------|-----|--------|----------------|
| **Development** | Feature development, developer testing | `https://dev.assetanchor.io` | Dev team only | On commit to feature branches |
| **Staging** | QA, UAT, pre-production validation | `https://staging.assetanchor.io` | Dev team, QA team, product owners | On merge to `staging` branch |
| **Production** | Live system for end users | `https://app.assetanchor.io` | All users | Manual deployment from `main` branch |

### Environment Configuration

Each environment has specific configurations controlled through environment variables:

```bash
# Example .env structure (different values per environment)
NODE_ENV=production                              # development, staging, production
API_URL=https://api.assetanchor.io               # Base API URL
DATABASE_URL=postgres://user:pass@host/db        # Database connection
REDIS_URL=redis://user:pass@host:port            # Redis connection
SENTRY_DSN=https://...@sentry.io/...             # Error tracking
LOG_LEVEL=info                                   # debug, info, warn, error
FEATURE_FLAGS={"newDashboard":true,"beta":false} # Feature flags configuration
```

## CI/CD Pipeline

### Build and Test Pipeline

1. **Code Commit**
   - Developer pushes code to feature branch
   - GitHub Actions triggered

2. **Automated Tests**
   - Linting and static analysis
   - Unit tests
   - Integration tests
   - Security scanning (SAST)

3. **Build Artifacts**
   - Backend: Docker image
   - Frontend: Static bundle

4. **Artifact Storage**
   - Docker images pushed to ECR/DockerHub
   - Frontend bundles uploaded to S3

### Deployment Pipeline

#### Development Deployment

1. **Trigger**: Automatic on commit to feature branch
2. **Process**:
   - Deploy to developer namespace in development cluster
   - Run smoke tests
   - Notify developer of deployment status

#### Staging Deployment

1. **Trigger**: Automatic on merge to `staging` branch
2. **Process**:
   - Deploy to staging environment
   - Run full regression test suite
   - Notify QA team of deployment ready for testing

#### Production Deployment

1. **Trigger**: Manual approval after staging validation
2. **Process**:
   - Create deployment plan
   - Schedule deployment window
   - Execute pre-deployment checklist
   - Deploy to production using blue/green strategy
   - Execute smoke tests
   - Monitor for any issues
   - Switch traffic if all tests pass

## Deployment Strategies

### Blue/Green Deployment

Used for production deployments to minimize downtime and risk.

1. **Setup**:
   - Maintain two identical production environments (Blue and Green)
   - Only one environment is live at any time

2. **Process**:
   - Deploy new version to inactive environment (e.g., Green)
   - Run validation tests on Green
   - Switch traffic from Blue to Green (DNS or load balancer update)
   - Blue becomes standby for next deployment

3. **Advantages**:
   - Zero downtime deployments
   - Instant rollback capability
   - Full testing in production-identical environment

4. **Implementation**:
   ```bash
   # Example deployment script
   #!/bin/bash
   
   # Deploy to inactive environment
   echo "Deploying to Green environment..."
   kubectl apply -f k8s/production-green.yml
   
   # Wait for deployment to complete
   kubectl rollout status deployment/asset-anchor-green
   
   # Run smoke tests
   echo "Running smoke tests..."
   ./scripts/smoke-tests.sh https://green.internal.assetanchor.io
   
   if [ $? -eq 0 ]; then
     echo "Tests passed! Switching traffic to Green..."
     # Update ingress/service to point to Green
     kubectl apply -f k8s/ingress-green.yml
     
     echo "Deployment complete! Green is now live."
   else
     echo "Tests failed! Aborting deployment."
     exit 1
   fi
   ```

### Canary Releases

Used for gradual rollouts of high-risk features.

1. **Process**:
   - Deploy new version alongside current version
   - Route a small percentage of traffic to new version
   - Gradually increase traffic as confidence builds
   - Promote to 100% or rollback based on monitoring

2. **Implementation**:
   ```yaml
   # Example Kubernetes service for canary
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: asset-anchor-ingress
     annotations:
       nginx.ingress.kubernetes.io/canary: "true"
       nginx.ingress.kubernetes.io/canary-weight: "10"
   spec:
     rules:
     - host: app.assetanchor.io
       http:
         paths:
         - path: /
           pathType: Prefix
           backend:
             service:
               name: asset-anchor-canary
               port:
                 number: 80
   ```

## Database Migrations

### Migration Process

1. **Development Phase**:
   - Develop schema changes with Alembic migrations
   - Test migration forward and backward
   - Include migration in PR

2. **Staging Phase**:
   - Execute migration on staging database
   - Verify application works with new schema
   - Validate data integrity

3. **Production Phase**:
   - Take database backup before migration
   - Execute migration during maintenance window or with zero-downtime strategy
   - Verify application functionality post-migration

### Zero-Downtime Migrations

For schema changes that could potentially cause downtime:

1. **Multi-Phase Deployment**:
   - Phase 1: Add new columns/tables without constraints
   - Phase 2: Deploy application code that writes to both old and new schema
   - Phase 3: Migrate data from old schema to new
   - Phase 4: Deploy application code that only uses new schema
   - Phase 5: Remove old schema elements

2. **Best Practices**:
   - Avoid long-running migrations in a single transaction
   - Use background jobs for data migrations
   - Add new columns as nullable
   - Create new tables before dropping old ones

## Rollback Procedures

### Immediate Rollback

For critical issues requiring immediate resolution:

1. **Frontend Rollback**:
   - Switch DNS/CDN to previous version
   ```bash
   aws s3 cp s3://asset-anchor-deployments/frontend-v1.2.0.zip s3://asset-anchor-frontend/ --recursive
   aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"
   ```

2. **Backend Rollback**:
   - Restore previous container version
   ```bash
   kubectl rollout undo deployment/asset-anchor-api
   # or with specific version
   kubectl set image deployment/asset-anchor-api asset-anchor-api=assetanchor/api:v1.2.0
   ```

3. **Database Rollback**:
   - Execute down migration if possible
   ```bash
   flask db downgrade
   ```
   - For complex issues, restore from backup
   ```bash
   # Example PostgreSQL restore
   pg_restore -d asset_anchor_db backup.dump
   ```

### Controlled Rollback

For non-critical issues during business hours:

1. **Assessment**:
   - Evaluate issue impact
   - Determine if hotfix is preferable to rollback
   - Create rollback plan with timing and steps

2. **Communication**:
   - Notify users of planned maintenance
   - Update status page
   - Brief support team on issue and ETA

3. **Execution**:
   - Schedule rollback during lowest traffic period
   - Execute rollback with full team monitoring
   - Verify functionality after rollback

## Deployment Artifacts

### Backend Docker Image

```dockerfile
# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

CMD ["gunicorn", "wsgi:app", "--workers", "4", "--bind", "0.0.0.0:5000"]
```

### Frontend Bundle

```bash
# Build production frontend
npm run build

# Upload to S3
aws s3 cp build/ s3://asset-anchor-frontend/ --recursive

# Invalidate CDN cache
aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"
```

## Monitoring Deployments

### Key Metrics to Monitor

1. **Error Rates**:
   - HTTP 5xx errors
   - Application exceptions
   - JS client errors

2. **Performance**:
   - API response times
   - Database query times
   - Frontend load time

3. **Resource Utilization**:
   - CPU/Memory usage
   - Database connections
   - Cache hit ratios

4. **Business Metrics**:
   - User login rate
   - Transaction success rate
   - Key workflow completion rates

### Alerting

Configure alerts for deployment-related issues:

1. **Immediate Alerts**:
   - Error rate increase >5% post-deployment
   - Any critical path failures
   - P95 latency increase >100ms

2. **Warning Alerts**:
   - Gradual error rate increase
   - Resource utilization trending toward limits
   - Abnormal user behavior patterns

## Deployment Checklist

### Pre-Deployment

- [ ] All feature acceptance criteria met
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Security scan issues addressed
- [ ] Database migrations tested
- [ ] Performance impact assessed
- [ ] Documentation updated
- [ ] Support team briefed
- [ ] Rollback plan documented
- [ ] Monitoring dashboards prepared

### During Deployment

- [ ] Database backup taken
- [ ] Deploy to inactive environment
- [ ] Run smoke tests
- [ ] Verify key functionality manually
- [ ] Check error rates
- [ ] Check performance metrics
- [ ] Switch traffic
- [ ] Verify monitoring dashboards

### Post-Deployment

- [ ] Monitor error rates for 1 hour
- [ ] Monitor performance metrics
- [ ] Verify critical business processes
- [ ] Update status page
- [ ] Notify stakeholders of successful deployment
- [ ] Document any issues encountered
- [ ] Schedule post-deployment review

## Special Case Deployments

### Large Data Migrations

For deployments involving large data migrations:

1. **Planning**:
   - Estimate migration time based on staging runs
   - Break migration into smaller batches if possible
   - Consider temporary read-only mode for affected features

2. **Execution**:
   - Schedule during off-peak hours
   - Use background jobs with progress tracking
   - Have database experts on standby

### Critical Security Patches

For urgent security vulnerability patches:

1. **Assessment**:
   - Evaluate vulnerability risk
   - Determine minimum required changes
   - Create targeted patch

2. **Expedited Process**:
   - Skip non-critical tests
   - Deploy directly to production if necessary
   - Monitor closely for any issues

## Deployment Communication

### Internal Stakeholders

1. **Pre-Deployment**:
   - Engineering team: Detailed technical overview
   - Product team: Feature summary and verification points
   - Support team: New features, known issues, rollback plan

2. **During Deployment**:
   - Real-time updates in deployment Slack channel
   - Status page updates for extended processes

3. **Post-Deployment**:
   - Deployment summary email
   - Knowledge base article updates

### End Users

1. **Pre-Deployment**:
   - Announce planned maintenance if downtime expected
   - Preview new features in blog/email

2. **During Deployment**:
   - Status page updates
   - Banner notice for planned maintenance

3. **Post-Deployment**:
   - Feature announcement
   - Release notes

## Deployment Schedule

1. **Regular Releases**:
   - Feature releases: Every two weeks
   - Maintenance releases: Weekly
   - Bug fixes: As needed

2. **Blackout Periods**:
   - Business-critical dates: End of month, tax seasons
   - Holidays
   - Weekends (except for emergency fixes)

3. **Preferred Deployment Windows**:
   - Standard deployments: Tuesday-Thursday, 10:00-14:00 ET
   - Major releases: Tuesday, 10:00 ET
   - Emergency fixes: Any time as needed

## Continuous Improvement

1. **Deployment Metrics**:
   - Deployment frequency
   - Lead time for changes
   - Change failure rate
   - Mean time to recovery

2. **Post-Deployment Reviews**:
   - Schedule review within 48 hours of significant deployments
   - Document what went well, what didn't, and action items
   - Update deployment process based on learnings

3. **Deployment Automation**:
   - Identify manual steps that can be automated
   - Regularly review and update deployment scripts
   - Conduct fire drills to test recovery procedures

## Appendix: Deployment Commands

### Kubernetes Deployment

```bash
# Apply deployment
kubectl apply -f k8s/deployment.yml

# Check status
kubectl rollout status deployment/asset-anchor-api

# Scale deployment
kubectl scale deployment/asset-anchor-api --replicas=5

# Rollback
kubectl rollout undo deployment/asset-anchor-api
```

### Database Commands

```bash
# Run migrations
flask db upgrade

# Backup database
pg_dump -U postgres -d asset_anchor_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
psql -U postgres -d asset_anchor_db < backup_20230101_120000.sql
```

### Monitoring Commands

```bash
# Check logs
kubectl logs -l app=asset-anchor-api --tail=100

# Get pod status
kubectl get pods -l app=asset-anchor-api

# Check resource usage
kubectl top pods -l app=asset-anchor-api
```

### AWS Commands

```bash
# Update Lambda function
aws lambda update-function-code --function-name asset-anchor-webhook --zip-file fileb://function.zip

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"

# Update auto-scaling group
aws autoscaling update-auto-scaling-group --auto-scaling-group-name asset-anchor-asg --min-size 3 --max-size 10
```
