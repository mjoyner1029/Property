#!/bin/bash
# Clean repository of large files

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
echo "Created temp directory: $TEMP_DIR"

# Copy all files except node_modules and git
echo "Copying files to temp directory..."
rsync -av --progress ./ "$TEMP_DIR/" --exclude node_modules --exclude .git

# Create a new git repository in the temp directory
echo "Creating new git repository..."
cd "$TEMP_DIR"
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit (clean repository)"

echo "New repository created at: $TEMP_DIR"
echo ""
echo "Next steps:"
echo "1. cd $TEMP_DIR"
echo "2. git remote add origin https://github.com/mjoyner1029/Property.git"
echo "3. git push -f origin main"
echo ""
echo "IMPORTANT: This will overwrite your remote repository history!"
