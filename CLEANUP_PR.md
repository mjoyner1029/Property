# Repository Cleanup

This PR cleans up the repository by moving unnecessary files to an `.archive` directory. This improves the repository structure and makes it easier to navigate while preserving historical files.

## Changes

- Moved ad-hoc test scripts to `.archive/test-scripts/`
- Moved duplicate/obsolete documentation to `.archive/docs/`
- Moved old SQL schema files to `.archive/sql/`
- Moved redundant shell scripts to `.archive/scripts/`
- Added README.md in `.archive/` explaining the purpose of archived files

## Why This Change

- **Cleaner Repository Structure** - Makes it easier for developers to navigate and understand the project
- **Reduced Confusion** - No ambiguity about which files to use for deployments and testing
- **Better Organization** - Core application files are now more prominent
- **Preservation of History** - Files are archived rather than deleted completely

## Testing

This change does not affect the application functionality as it only moves unused files to an archive directory.

## Notes for Review

- If any moved file is actually needed in the main directory structure, please comment and it can be restored
- These changes only affect files outside the core `backend/`, `frontend/`, and `docs/` directories
