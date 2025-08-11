#!/bin/bash
# Clean repository and create a new one without large files

echo "Creating a clean working directory..."
mkdir -p /tmp/clean-property

echo "Copying current files (excluding node_modules and .git)..."
rsync -av --progress ./ /tmp/clean-property/ --exclude node_modules --exclude .git --exclude "*.pack"

echo "Creating new git repository in the clean directory..."
cd /tmp/clean-property
git init

echo "Setting up remote..."
git remote add origin https://github.com/mjoyner1029/Property.git

echo "Adding all files..."
git add .

echo "Committing files..."
git commit -m "chore: clean repository (remove large files)"

echo ""
echo "Clean repository created at /tmp/clean-property"
echo ""
echo "IMPORTANT: To push this and replace your GitHub repository, run:"
echo "cd /tmp/clean-property"
echo "git push -f origin main"
echo ""
echo "WARNING: This will completely replace your GitHub repository history!"
