#!/bin/bash
# Remove node_modules directories from git

echo "Updating .gitignore to exclude node_modules and cache files..."
cat <<EOT >> .gitignore

# Explicitly ignore node modules and their cache
**/node_modules/
**/node_modules/**
**/node_modules/.cache/**
**/.cache/
**/*.pack
EOT

echo "Removing node_modules from git tracking..."
git rm -r --cached */node_modules 2>/dev/null || echo "No node_modules in git tracking"

echo "Committing changes..."
git add .gitignore .gitattributes
git commit -m "chore: update gitignore and attributes to exclude node_modules and large files"

echo "Done! Now you can push your changes."
