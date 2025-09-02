# Scripts

This directory contains utility scripts for development, deployment, and operations of the Property Management application.

## Scripts Inventory

For a complete inventory and documentation of all scripts in this directory, see [SCRIPT_INVENTORY.md](SCRIPT_INVENTORY.md).

## Main Scripts

- `pre-deploy-check.sh` - Run checks before deployment
- `run_migrations.sh` - Execute database migrations
- `smoke_test.py` - Run smoke tests against deployed environment
- `tag_release.sh` - Tag a new release in git
- `rollback_backend.sh` / `rollback_frontend.sh` - Roll back deployments if needed
- `quick_test_sentry.py` - Quick Sentry integration test
- `verify_security_headers.py` - Comprehensive security header verification

## Cleanup Notes

Some redundant scripts have been moved to the `archive` directory. See [CLEANUP_RECOMMENDATIONS.md](CLEANUP_RECOMMENDATIONS.md) for details on our script organization.
