#!/bin/bash
set -eo pipefail

# Script to update GitHub Action references in all workflow files
# Replaces @vX.Y.Z references with specific commit SHAs

# Common Actions and their SHA mappings
ACTION_MAPPINGS=(
  "actions/checkout@v3:8ade135a41bc03ea155e62e844d188df1ea18608 # v4.1.0"
  "actions/checkout@v4:8ade135a41bc03ea155e62e844d188df1ea18608 # v4.1.0"
  "actions/checkout@v5:8ade135a41bc03ea155e62e844d188df1ea18608 # v4.1.0"
  "actions/setup-node@v3:49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.0.1"
  "actions/setup-node@v4:49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.0.1"
  "actions/setup-python@v3:82c7e631bb3cdc910f68e0081d67478d79c6982d # v5.0.0"
  "actions/setup-python@v4:82c7e631bb3cdc910f68e0081d67478d79c6982d # v5.0.0"
  "actions/setup-python@v5:82c7e631bb3cdc910f68e0081d67478d79c6982d # v5.0.0"
  "actions/upload-artifact@v3:26f29941396feab9e9d8596440e50339d00fd9ae # v4.3.0"
  "actions/upload-artifact@v4:26f29941396feab9e9d8596440e50339d00fd9ae # v4.3.0"
  "actions/cache@v3:13aacd865c20de90d75de3b17ebe84f7a17d57d2 # v4.0.0"
  "actions/cache@v4:13aacd865c20de90d75de3b17ebe84f7a17d57d2 # v4.0.0"
  "grafana/setup-k6@v1:1b6affdd0b94a32e7cd115c14479ae22b0ec67f0 # v1.1.0"
  "vercel/actions/deploy@v3:6b0a233fa5697fc11ca2515ca159ebbf5dea3fc7 # v3.0.2"
)

# Find all workflow files
WORKFLOW_FILES=$(find .github/workflows -name "*.yml" -type f)

# Add permissions block to workflows that don't have it
add_permissions() {
  local file=$1
  if ! grep -q "permissions:" "$file"; then
    # Find the line with "jobs:" and add permissions after on:
    sed -i.bak '/^on:/,/^jobs:/{/^jobs:/i\
permissions:\
  contents: read
}' "$file"
    rm -f "${file}.bak"
    echo "Added permissions block to $file"
  fi
}

# Process each workflow file
for file in $WORKFLOW_FILES; do
  echo "Processing $file..."
  
  # Add permissions block if not present
  add_permissions "$file"
  
  # Replace action references with pinned versions
  for action_map in "${ACTION_MAPPINGS[@]}"; do
    action="${action_map%%:*}"
    replacement="${action_map#*:}"
    if grep -q "uses: $action" "$file"; then
      sed -i.bak "s|uses: $action|uses: ${action%@*}@$replacement|g" "$file"
      rm -f "${file}.bak"
      echo "  Replaced $action with pinned version"
    fi
  done
done

echo "All workflow files updated with pinned action versions."
