#!/bin/bash
cd "$(dirname "$0")/.."

# Find all files with _error that might be used
files=$(grep -r "const \[_error, setError\]" src --include="*.jsx" --include="*.js" | grep -v "node_modules" | cut -d: -f1)

echo "Found $(echo "$files" | wc -l | xargs) files with _error that might be used."

for file in $files; do
  echo "Fixing $file"
  # Replace the declaration
  sed -i '' 's/const \[_error, setError\]/const \[error, setError\]/g' "$file"
  
  # Replace any usage of _error in JSX/display
  sed -i '' 's/{_error/{error/g' "$file"
done

echo "Done fixing error variables."
