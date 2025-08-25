#!/bin/bash

set -euo pipefail

echo "Applying GitHub Actions security hardening changes..."

# Step 1: Create directory if it doesn't exist
mkdir -p .github

# Step 2: Apply the workflow file changes
echo "Updating workflow files..."
mv .github/workflows/backend-ci.yml.new .github/workflows/backend-ci.yml
mv .github/workflows/frontend-ci.yml.new .github/workflows/frontend-ci.yml
mv .github/workflows/deploy.yml.new .github/workflows/deploy.yml
mv .github/workflows/security-audit.yml.new .github/workflows/security-audit.yml

# Step 3: Make the script executable
chmod +x scripts/tag_release.sh

echo "Changes applied successfully!"
echo "Please review the SECURITY_HARDENING_GUIDE.md file for next steps."
