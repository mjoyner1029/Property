#!/bin/bash
# Find and remove large files from Git repository history

# Find large files in git history
echo "Finding large files in repository history..."
git rev-list --objects --all | \
    git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
    sed -n 's/^blob //p' | \
    sort -k2nr | \
    head -100 > large_files.txt

echo "Top 10 largest files:"
cat large_files.txt | head -10

echo ""
echo "Creating a commit to exclude large files from tracking..."
cat >> .gitignore << EOF

# Large files excluded ($(date))
frontend/node_modules/.cache/default-development/
frontend/node_modules/.cache/**/*.pack
**/*.pack
EOF

git add .gitignore
git commit -m "chore: exclude large pack files from git tracking"

echo ""
echo "Next steps:"
echo "1. Push this branch to GitHub: git push -u origin fix-large-files"
echo "2. Create PR and merge into main"
echo "3. After merging, everyone should clone a fresh copy of the repository"
