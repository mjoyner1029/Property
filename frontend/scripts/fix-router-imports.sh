#!/bin/bash
cd "$(dirname "$0")/.."

# Find all files with _useParams in import statements
files=$(grep -r "import.*_useParams.*from.*react-router-dom" src --include="*.jsx" --include="*.js" | grep -v "node_modules" | cut -d: -f1)

echo "Found $(echo "$files" | wc -l | xargs) files with _useParams imports."

for file in $files; do
  echo "Fixing $file"
  # Replace _useParams with useParams in imports
  sed -i '' 's/import.*{.*_useParams/import { useParams/g' "$file"
  sed -i '' 's/_useParams.*useNavigate/useParams, useNavigate/g' "$file"
  sed -i '' 's/useNavigate.*_useParams/useNavigate, useParams/g' "$file"
done

echo "Done fixing router imports."
