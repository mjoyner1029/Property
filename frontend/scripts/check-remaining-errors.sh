#!/bin/bash
cd "$(dirname "$0")/.."

echo "Checking for duplicate imports..."
grep -r "import.*_use.*" src --include="*.jsx" --include="*.js" | grep -v "node_modules"

echo -e "\nChecking for underscore prefixed variables that might be used..."
grep -r "const \[_" src --include="*.jsx" --include="*.js" | grep -v "node_modules" | grep "set"

echo -e "\nChecking for theme usage without useTheme import..."
for file in $(grep -r "theme\." src --include="*.jsx" --include="*.js" | grep -v "node_modules" | cut -d: -f1 | sort | uniq); do
  if ! grep -q "useTheme" "$file"; then
    echo "$file: Uses theme but might be missing useTheme import"
  fi
done

echo -e "\nChecking for duplicate theme variables..."
grep -r "const theme" src --include="*.jsx" --include="*.js" | grep -v "node_modules" | sort | uniq -c | sort -nr | grep -v "^ *1 "
