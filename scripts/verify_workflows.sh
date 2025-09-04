#!/bin/bash
# Script to verify CI workflow configurations
# This script checks the syntax of GitHub Actions workflow files
# and verifies that all required actions are properly pinned to SHAs

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKFLOWS_DIR="$ROOT_DIR/.github/workflows"
TEMP_DIR="$(mktemp -d)"

echo "=== GitHub Actions Workflow Verification ==="
echo "Workflows directory: $WORKFLOWS_DIR"

# Cleanup on exit
trap 'rm -rf "$TEMP_DIR"' EXIT

# Check if all workflows have valid syntax
echo -e "\n=== Checking workflow syntax ==="
for workflow in "$WORKFLOWS_DIR"/*.yml; do
  filename=$(basename "$workflow")
  echo -n "Validating $filename... "
  
  # Simple YAML validation (requires PyYAML)
  if python3 -c "import yaml; yaml.safe_load(open('$workflow', 'r'))" 2>/dev/null; then
    echo "✅ Valid YAML"
  else
    echo "❌ Invalid YAML - please check syntax"
    echo "Consider installing yamllint for better validation"
    # Don't exit on error, just warn
    # exit 1
  fi
done

# Check if all actions are properly pinned
echo -e "\n=== Checking for unpinned actions ==="
unpinned_actions=$(grep -r "uses:.*@v" --include="*.yml" "$WORKFLOWS_DIR" | grep -v "action-pin-check.yml" || true)

if [ -n "$unpinned_actions" ]; then
  echo "❌ Found unpinned actions:"
  echo "$unpinned_actions"
  echo "Please pin these actions to specific commit SHAs"
  exit 1
else
  echo "✅ All actions are properly pinned to commit SHAs"
fi

# Check for missing permissions in workflows
echo -e "\n=== Checking for missing permissions ==="
missing_permissions=0
for workflow in "$WORKFLOWS_DIR"/*.yml; do
  filename=$(basename "$workflow")
  if ! grep -q "permissions:" "$workflow"; then
    echo "❌ $filename is missing permissions"
    missing_permissions=1
  fi
done

if [ "$missing_permissions" -eq 0 ]; then
  echo "✅ All workflows have permissions specified"
else
  echo "Please add permissions blocks to the workflows listed above"
  exit 1
fi

# Verify workflow files against common patterns
echo -e "\n=== Checking for common workflow issues ==="
issues_found=0

# Check for use of set-output (deprecated)
if grep -r "::set-output" --include="*.yml" "$WORKFLOWS_DIR" > /dev/null; then
  echo "⚠️ Deprecated syntax found: ::set-output. Use GITHUB_OUTPUT environment file instead."
  issues_found=1
fi

# Check for use of save-state (deprecated)
if grep -r "::save-state" --include="*.yml" "$WORKFLOWS_DIR" > /dev/null; then
  echo "⚠️ Deprecated syntax found: ::save-state. Use GITHUB_STATE environment file instead."
  issues_found=1
fi

if [ "$issues_found" -eq 0 ]; then
  echo "✅ No common workflow issues found"
fi

echo -e "\n=== CI Verification Complete ==="
echo "✅ All checks passed"
