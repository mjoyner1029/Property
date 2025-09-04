# GitHub Actions Security Best Practices

This document outlines security best practices for GitHub Actions used in this project, focused on supply chain security and least privilege principles.

## Action Pinning

All third-party GitHub Actions in this repository are pinned to specific commit SHAs rather than version tags (e.g., `@v4`). This ensures:

- **Supply Chain Security**: Prevents potential supply chain attacks where a tag could be moved to a malicious commit
- **Reproducibility**: Guarantees the exact same action code runs every time
- **Auditability**: Makes security review easier by referencing immutable commits

## Refreshing Action Versions

To update an action to a newer version:

1. **Find the latest release** of the action on its GitHub repository
2. **Get the commit SHA** for that release tag
3. **Update the workflow file** to use the new SHA
4. **Add a comment** with the version tag for reference

Example:
```yaml
- uses: actions/checkout@44c2b7a8a4ea60a981eaca3cf939b5f4305c123f # v4.1.5
```

### Script for Checking Latest Versions

You can use this script to check for the latest versions of common actions:

```bash
#!/bin/bash

# Define common actions to check
ACTIONS=(
  "actions/checkout"
  "actions/setup-node"
  "actions/setup-python"
  "actions/cache"
  "actions/upload-artifact"
  "docker/setup-buildx-action"
  "docker/build-push-action"
)

# Check latest versions
for action in "${ACTIONS[@]}"; do
  echo "Checking latest version for $action"
  latest_tag=$(curl -s "https://api.github.com/repos/$action/releases/latest" | jq -r '.tag_name')
  latest_commit=$(curl -s "https://api.github.com/repos/$action/git/refs/tags/$latest_tag" | jq -r '.object.sha')
  
  # For annotated tags, need to get the commit it points to
  if [[ $(curl -s "https://api.github.com/repos/$action/git/refs/tags/$latest_tag" | jq -r '.object.type') == "tag" ]]; then
    tag_sha=$latest_commit
    latest_commit=$(curl -s "https://api.github.com/repos/$action/git/tags/$tag_sha" | jq -r '.object.sha')
  fi
  
  echo "  Latest tag: $latest_tag"
  echo "  Commit SHA: $latest_commit"
  echo ""
done
```

## Least Privilege Permissions

All workflows use explicit permissions with the principle of least privilege:

- Default setting: `permissions: contents: read`
- Additional permissions are added only when specifically needed

## CI Workflow Enhancements

Our CI workflows have been enhanced to:

1. **Focus on Python 3.11**: Backend workflows now target Python 3.11 specifically
2. **Include gevent testing**: Backend tests now explicitly test with gevent worker
3. **Improved artifact collection**: All workflows now save logs and additional context for troubleshooting
4. **Status badges**: README includes workflow status badges for quick visibility
5. **Comprehensive checks**: Workflows perform thorough validation of code quality and security

## Workflow Security Audit

To perform a security audit of workflows:

1. Run the action-pin-check workflow to verify all actions are pinned to SHAs
2. Manually review permissions in each workflow to ensure they follow least privilege
3. Periodically update pinned actions to their latest secure versions
4. Use the `scripts/verify_workflows.sh` script to check workflows locally:
   ```bash
   ./scripts/verify_workflows.sh
   ```
   This script checks for:
   - Proper YAML syntax
   - Pinned action SHAs
   - Required permissions blocks
   - Deprecated GitHub Actions syntax
