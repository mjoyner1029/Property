# Asset Anchor Release Management Strategy

This document outlines the release management process for the Asset Anchor platform, ensuring consistent, reliable, and well-documented releases.

## Release Cadence and Types

### Release Types

| Type | Frequency | Scope | Approval | Testing | Example |
|------|-----------|-------|----------|---------|---------|
| Patch | As needed | Bug fixes, security patches | Tech lead | Automated tests | v1.2.1 → v1.2.2 |
| Minor | Bi-weekly | New features, non-breaking changes | Product manager | Full regression | v1.2.0 → v1.3.0 |
| Major | Quarterly | Breaking changes, major features | Executive | Full regression + UAT | v1.0.0 → v2.0.0 |
| Hotfix | As needed | Critical fixes | Tech lead + Ops | Limited scope tests | v1.2.2 → v1.2.2-hotfix.1 |

### Release Schedule

- **Regular Releases**: Every other Wednesday at 10:00 AM EST
- **Hotfixes**: As soon as validated, preferably during business hours
- **Major Releases**: Scheduled at least 4 weeks in advance, with dedicated deployment window

## Versioning Strategy

Asset Anchor follows Semantic Versioning (SemVer):

- **Format**: MAJOR.MINOR.PATCH
- **Major**: Breaking changes or significant new functionality
- **Minor**: New features, non-breaking changes
- **Patch**: Bug fixes, security updates

### Version Tagging

```bash
# Create a new version tag
git tag -a v1.3.0 -m "Release v1.3.0"

# Push tags to remote
git push origin v1.3.0

# Create release tag script
./scripts/tag_release.sh 1.3.0 "Release notes for v1.3.0"
```

## Release Lifecycle

### 1. Planning Phase

- **Timeline**: 1-2 sprints before release
- **Activities**:
  - Feature freeze date determined
  - Release scope finalized
  - Release milestone created in issue tracker
  - Dependencies identified and planned

### 2. Development Phase

- **Timeline**: 1-2 sprints
- **Activities**:
  - Feature development
  - Code reviews
  - Unit testing
  - Documentation updates
  - Daily standup updates on release progress

### 3. Stabilization Phase

- **Timeline**: 3-5 days before release
- **Activities**:
  - Feature freeze
  - Bug fixing
  - Regression testing
  - Performance testing
  - Release candidate builds
  - Release notes drafted

### 4. Release Preparation

- **Timeline**: 1-2 days before release
- **Activities**:
  - Final QA signoff
  - Release notes finalized
  - Deployment plan reviewed
  - Pre-deployment checklist verification
  - Stakeholder notification

### 5. Deployment Phase

- **Timeline**: Release day
- **Activities**:
  - Pre-deployment verification
  - Database migrations
  - Phased deployment (if applicable)
  - Deployment verification
  - Rollback preparation

### 6. Post-Release Phase

- **Timeline**: 1-3 days after release
- **Activities**:
  - Monitoring for issues
  - User feedback collection
  - Hotfix planning (if needed)
  - Retrospective meeting
  - Release documentation archiving

## Release Roles and Responsibilities

| Role | Responsibilities | Pre-Release | During Release | Post-Release |
|------|------------------|-------------|---------------|--------------|
| Release Manager | Overall coordination | Plan schedule, track readiness | Coordinate deployment | Lead retrospective |
| Tech Lead | Technical oversight | Code review, architecture decisions | Technical support | Technical review |
| QA Lead | Quality assurance | Test planning, regression testing | Verification testing | Issue triage |
| Product Manager | Feature definition | Scope definition, prioritization | Stakeholder communication | Feedback collection |
| DevOps | Infrastructure | Environment preparation | Deployment execution | Monitoring |
| Support | Customer impact | Knowledge base updates | Customer communication | Issue response |

## Environments and Promotion

### Environment Structure

| Environment | Purpose | Update Frequency | Data | Access |
|-------------|---------|-----------------|------|--------|
| Development | Active development | Continuous | Sanitized copy | All developers |
| Integration | Feature integration | Daily | Sanitized copy | All team members |
| Staging | Pre-production testing | After release approval | Production-like | Team + Stakeholders |
| Production | Live system | Scheduled releases | Real data | Restricted |

### Code Promotion Flow

```
Feature Branch → Develop → Release Branch → Main → Production
```

```bash
# Example promotion process
# Start a feature
git checkout -b feature/new-feature develop

# Complete feature
git checkout develop
git merge --no-ff feature/new-feature

# Create release branch
git checkout -b release/1.3.0 develop

# Stabilize release
git checkout release/1.3.0
git commit -m "Fix last-minute bug"

# Complete release
git checkout main
git merge --no-ff release/1.3.0
git tag -a v1.3.0

# Update develop with release fixes
git checkout develop
git merge --no-ff main
```

## Deployment Process

### Pre-Deployment Checklist

Use the `scripts/pre-deploy-check.sh` script to verify:
- All tests passing
- Security scans clear
- Performance benchmarks met
- Database migrations tested
- Documentation updated
- Rollback plan documented

### Deployment Steps

1. **Preparation**
   ```bash
   # Tag the release
   ./scripts/tag_release.sh 1.3.0
   
   # Run pre-deployment checks
   ./scripts/pre-deploy-check.sh
   ```

2. **Database Updates**
   ```bash
   # Backup database
   ./scripts/run_migrations.sh --backup
   
   # Apply migrations
   ./scripts/run_migrations.sh
   ```

3. **Backend Deployment**
   ```bash
   # Deploy to Render
   git push origin main
   
   # Monitor deployment
   ./scripts/monitor_deployment.sh --service=backend
   ```

4. **Frontend Deployment**
   ```bash
   # Deploy to Vercel
   git push origin main
   
   # Verify deployment
   ./scripts/verify-deployment.sh --service=frontend
   ```

5. **Verification**
   ```bash
   # Run smoke tests
   ./scripts/smoke_test.py --environment=production
   ```

### Rollback Procedure

If issues are detected post-deployment:

1. **Assessment**
   - Determine severity and impact
   - Decide between fix-forward or rollback

2. **Rollback Execution**
   ```bash
   # Rollback database (if needed)
   ./scripts/run_migrations.sh --rollback
   
   # Rollback code
   ./scripts/rollback.sh --version=1.2.0
   ```

3. **Verification**
   ```bash
   # Verify rollback
   ./scripts/verify-deployment.sh --rollback
   ```

## Feature Flags

### Feature Flag Strategy

Use feature flags to separate deployment from feature release:

```python
# Example feature flag implementation
def is_feature_enabled(feature_name, user=None):
    if feature_name not in FEATURES:
        return False
        
    feature = FEATURES[feature_name]
    
    # Check if globally enabled
    if feature.get('enabled', False):
        return True
        
    # Check user-specific rules
    if user and user.id in feature.get('user_ids', []):
        return True
        
    # Check percentage rollout
    if user and feature.get('percentage', 0) > 0:
        # Deterministic hashing to ensure consistent experience
        user_hash = hash(f"{user.id}:{feature_name}") % 100
        return user_hash < feature.get('percentage')
        
    return False
```

### Flag Types

1. **Release Flags**
   - Purpose: Separate deployment from release
   - Lifecycle: Temporary (1-2 releases)
   - Example: `enable_new_billing_system`

2. **Experiment Flags**
   - Purpose: A/B testing
   - Lifecycle: Until experiment concludes
   - Example: `show_new_property_card_design`

3. **Ops Flags**
   - Purpose: Emergency controls
   - Lifecycle: Permanent
   - Example: `maintenance_mode`

## Release Documentation

### Release Notes Template

```markdown
# Release v1.3.0 - [Date]

## New Features
- Feature A: Brief description [JIRA-123]
- Feature B: Brief description with [screenshot link] [JIRA-456]

## Improvements
- Improved performance for property search by 30% [JIRA-789]
- Enhanced mobile responsiveness for dashboard views

## Bug Fixes
- Fixed issue with payment processing timeouts [JIRA-101]
- Corrected display of property images on mobile devices [JIRA-102]

## Security Updates
- Updated dependencies with security vulnerabilities
- Enhanced password validation rules

## API Changes
- Added new endpoint `GET /api/v1/properties/featured`
- Deprecated endpoint `GET /api/v1/old-endpoint` (will be removed in v1.5.0)

## Configuration Changes
- New environment variable `FEATURE_NEW_BILLING` (default: false)
- Increased rate limits for authenticated API calls

## Known Issues
- Intermittent delay in notification delivery on high-load scenarios [JIRA-555]

## Upgrade Notes
- Database migration will take approximately 5-10 minutes
- Cache will be invalidated during deployment
```

### Changelog Management

- Maintain `CHANGELOG.md` in the repository root
- Update with each release
- Include all changes categorized by type
- Link to relevant issues/PRs

## Measuring Release Quality

### Key Metrics

1. **Release Health**
   - Deployment success rate
   - Rollback frequency
   - Time to detect issues
   - Time to resolve issues

2. **Code Quality**
   - Test coverage
   - Static analysis results
   - Code review participation

3. **Process Efficiency**
   - Time from commit to production
   - Feature cycle time
   - Release preparation time

### Post-Release Review

Conduct a release retrospective within 3 days of each release:

1. What went well?
2. What went wrong?
3. What can be improved?
4. Action items for next release

## Compliance and Auditing

### Release Audit Trail

For each release, maintain:

1. **Release Package**
   - Git tag/commit hash
   - Build artifacts
   - Configuration changes
   - Environment variables

2. **Approval Documentation**
   - Sign-offs from required approvers
   - Risk assessment
   - Security review results

3. **Deployment Records**
   - Deployment timestamps
   - Deployer identity
   - Environment configuration
   - Database migration logs

### Retention Policy

- Release packages: 24 months
- Deployment logs: 12 months
- Database backups: According to data retention policy

## Appendix: Release Tools and Scripts

### Available Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `tag_release.sh` | Create git tag and GitHub release | `./scripts/tag_release.sh 1.3.0 "Release notes"` |
| `pre-deploy-check.sh` | Verify release readiness | `./scripts/pre-deploy-check.sh` |
| `run_migrations.sh` | Apply database migrations | `./scripts/run_migrations.sh` |
| `rollback.sh` | Rollback to previous version | `./scripts/rollback.sh --version=1.2.0` |
| `smoke_test.py` | Run post-deploy verification | `./scripts/smoke_test.py` |

### Release Checklist

```
# Asset Anchor Release Checklist

## Pre-Release
- [ ] All features complete and merged to develop
- [ ] Release branch created
- [ ] Version numbers updated
- [ ] Documentation updated
- [ ] Release notes drafted
- [ ] All tests passing
- [ ] Performance tests run
- [ ] Security scan completed
- [ ] Accessibility review completed
- [ ] Product owner sign-off
- [ ] Tech lead sign-off

## Deployment Day
- [ ] Pre-deployment backup taken
- [ ] Deployment announcement sent
- [ ] Database migrations applied
- [ ] Code deployed
- [ ] Smoke tests passed
- [ ] Manual verification completed
- [ ] Monitoring alerts configured

## Post-Release
- [ ] Release notes published
- [ ] Knowledge base updated
- [ ] Support team briefed
- [ ] Metrics being collected
- [ ] Post-release bugs tracked
- [ ] Retrospective scheduled
```
