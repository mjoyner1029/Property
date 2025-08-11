#!/bin/bash
#
# Asset Anchor Release Tagger
#
# Creates an annotated Git tag for releases with commit messages since the last tag
#
# Usage: ./tag_release.sh <version>
# Example: ./tag_release.sh v1.0.0

set -e

if [ $# -ne 1 ]; then
  echo "Error: Version argument required"
  echo "Usage: $0 <version>"
  echo "Example: $0 v1.0.0"
  exit 1
fi

VERSION=$1

# Validate version format
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  echo "Error: Version must be in format v1.2.3 or v1.2.3-alpha.1"
  exit 1
fi

# Get the last tag if any
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

echo "Creating new release tag: $VERSION"

# Generate tag message with commits since last tag
if [ -z "$LAST_TAG" ]; then
  echo "No previous tags found. Including all commits in tag message."
  TAG_MESSAGE=$(git log --pretty=format:"* %s (%h)" --no-merges)
else
  echo "Previous tag: $LAST_TAG. Including commits since then in tag message."
  TAG_MESSAGE=$(git log --pretty=format:"* %s (%h)" --no-merges "$LAST_TAG"..HEAD)
fi

# Create temporary tag message file
TMP_FILE=$(mktemp)
cat > "$TMP_FILE" << EOF
Release $VERSION

Changes:
$TAG_MESSAGE

Tagged on $(date "+%Y-%m-%d %H:%M:%S")
EOF

# Create annotated tag
git tag -a "$VERSION" -F "$TMP_FILE"

# Clean up temp file
rm "$TMP_FILE"

echo "Tag $VERSION created successfully!"
echo "Push the tag with: git push origin $VERSION"
