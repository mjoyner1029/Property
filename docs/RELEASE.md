# Release Management

This document outlines the release process, migration policies, and rollback procedures for the Property application.

## Release Process

### Release Schedule

- **Production Releases**: Every two weeks (bi-weekly)
- **Hotfixes**: As needed for critical issues
- **Staging Deployments**: Daily or as needed for feature validation

### Version Numbering

We use [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking API changes
- **MINOR**: New features, backwards-compatible
- **PATCH**: Bug fixes, backwards-compatible

Example: `2.3.1`

### Release Branches

- `main`: Always contains the latest stable code, deployable to production
- `develop`: Integration branch for new features
- `feature/*`: Individual feature branches
- `release/v*`: Release preparation branches
- `hotfix/*`: Emergency fixes for production

### Pre-Release Checklist

1. Code freeze on `develop` branch 24 hours before release
2. Create release branch: `release/v{version}`
3. Run full test suite and address any failures
4. Conduct final code review
5. Update version numbers in:
   - `package.json` (frontend)
   - `setup.py` (backend)
   - Other version-specific files
6. Generate release notes
7. Deploy to staging environment for final testing
8. Merge release branch to `main` when approved

## Deployment Process

### Staging Deployment

1. **Trigger**: Automatic upon merge to `develop` branch or manual via GitHub Actions
2. **Process**:
   ```
   1. Run tests
   2. Build application
   3. Apply database migrations
   4. Deploy to staging environment
   5. Run smoke tests
   6. Run Day-2 verification scripts
   ```
3. **Verification**: Automated tests + manual QA checklist

### Production Deployment

1. **Trigger**: Manual approval via GitHub Actions after merge to `main`
2. **Process**:
   ```
   1. Run tests
   2. Build and tag Docker images
   3. Deploy database migrations
   4. Blue/Green deployment:
      a. Deploy to new environment
      b. Run smoke tests
      c. Switch traffic to new environment
   5. Run post-deploy verification
   ```
3. **Approval**: Required from at least one senior developer

### Hotfix Deployment

1. Create hotfix branch from `main`: `hotfix/v{version}-{issue}`
2. Implement and test fix
3. Create PR to `main` branch
4. After approval, merge to `main` and tag release
5. Backport fix to `develop` if needed
6. Deploy to production using normal deployment process

## Database Migration Policy

### Database Migration Guidelines

- All schema changes must be performed via migrations
- Each migration must be backward compatible with previous code version
- All migrations must have a corresponding rollback implementation
- Migrations should be idempotent (safe to run multiple times)

### Types of Migrations

1. **Schema Migrations**: Table/column additions or modifications
2. **Data Migrations**: Data transformations or backfills
3. **Index Migrations**: Adding or removing database indexes

### Migration Strategy

- **Deploy Schema Changes First**: Deploy migrations before deploying application code
- **Zero Downtime**: Migrations should not require downtime
- **Feature Toggles**: Use feature flags to control new functionality using new schema

### Database Migration Process

1. Create migration script:
   ```bash
   cd backend
   python migrate.py create "description_of_change"
   ```

2. Implement `upgrade()` and `downgrade()` functions

3. Test migration:
   ```bash
   python migrate.py upgrade --sql  # Review SQL
   python migrate.py upgrade        # Apply changes
   python migrate.py downgrade      # Test rollback
   ```

4. Commit migration file

5. In production deployment:
   ```bash
   # First step of deployment
   python migrate.py upgrade
   
   # If successful, continue with application deployment
   # If failed, automatic rollback is triggered
   ```

### Backfill Considerations

For large data backfills:
1. Create a separate migration script
2. Implement chunked processing for large datasets
3. Make backfill idempotent (safe to run multiple times)
4. Consider running as a background job for very large datasets

## Rollback Procedures

### Criteria for Rollback

Consider a rollback when:
- Critical functionality is broken
- Security vulnerability is discovered
- Database corruption occurs
- Payment processing failures exceed 1% of transactions

### Code Rollback Process

1. Identify last stable version
2. Trigger rollback deployment in CI/CD pipeline:
   ```bash
   # Manual rollback command
   ./scripts/deploy.sh rollback v{last-stable-version}
   ```

3. Verify rollback was successful with smoke tests
4. Notify team and users about the rollback

### Database Rollback Process

1. For schema changes, run migration downgrade:
   ```bash
   python migrate.py downgrade -1  # Roll back one migration
   ```

2. For data corruption, restore from latest backup:
   ```bash
   ./scripts/restore_db.sh {backup_timestamp}
   ```

3. Verify database integrity

### Recovery Time Objectives

- **Code Rollback**: < 15 minutes
- **Simple Database Rollback**: < 30 minutes
- **Full Database Restore**: < 2 hours

## Monitoring After Release

### Post-Deployment Verification

1. Run automated smoke tests
2. Check error rates in monitoring system
3. Verify critical business flows manually
4. Monitor performance metrics for 1 hour

### Key Metrics to Monitor

- Error rates in application logs
- API response times
- Database performance
- User engagement metrics
- Payment processing success rate

### Alert Thresholds

- >1% increase in error rate
- >20% increase in response time
- Any failed payments
- Database CPU >80%

## Communication

### Pre-Release Communication

1. Release announcement sent 48 hours before deployment
2. Maintenance window communicated 24 hours before deployment
3. Documentation updated before release

### During Deployment

1. Status page updated at start of deployment
2. Updates posted for any issues or delays
3. Engineering team available in dedicated chat channel

### Post-Deployment

1. Deployment confirmation sent to stakeholders
2. Release notes published
3. Status page updated to "Operational"
