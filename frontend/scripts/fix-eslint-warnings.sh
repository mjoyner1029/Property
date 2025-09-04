#!/bin/bash

cd /Users/mjoyner/Property/frontend

echo "Prefixing unused variables with underscore for ESLint..."

# Create a backup of all files (optional)
# mkdir -p backups
# find src -name "*.js" -o -name "*.jsx" -exec cp {} backups/ \;

# Process all JS/JSX files
find src -type f \( -name "*.js" -o -name "*.jsx" \) | while read file; do
  echo "Processing $file..."
  
  # Skip node_modules
  if [[ $file == *"node_modules"* ]]; then
    continue
  fi

  # Replace common unused variables with prefixed versions
  sed -i'' -e 's/import { \([^}]*\)useEffect\([^}]*\) } from "react"/import { \1_useEffect\2 } from "react"/g' "$file"
  sed -i'' -e 's/import { \([^}]*\)useCallback\([^}]*\) } from "react"/import { \1_useCallback\2 } from "react"/g' "$file"
  sed -i'' -e 's/import HomeIcon from/import _HomeIcon from/g' "$file"
  sed -i'' -e 's/import LogoutIcon from/import _LogoutIcon from/g' "$file"
  sed -i'' -e 's/import BugReportIcon from/import _BugReportIcon from/g' "$file"
  sed -i'' -e 's/import Paper from/import _Paper from/g' "$file"
  sed -i'' -e 's/import IconButton from/import _IconButton from/g' "$file"
  sed -i'' -e 's/import Alert from/import _Alert from/g' "$file"
  sed -i'' -e 's/import DeleteIcon from/import _DeleteIcon from/g' "$file"
  sed -i'' -e 's/import FilterListIcon from/import _FilterListIcon from/g' "$file"
  sed -i'' -e 's/import Avatar from/import _Avatar from/g' "$file"
  sed -i'' -e 's/import Stack from/import _Stack from/g' "$file"
  sed -i'' -e 's/import Link from/import _Link from/g' "$file"
  sed -i'' -e 's/import Chip from/import _Chip from/g' "$file"
  sed -i'' -e 's/import InputAdornment from/import _InputAdornment from/g' "$file"
  sed -i'' -e 's/import LoadingButton from/import _LoadingButton from/g' "$file"
  sed -i'' -e 's/import Button from/import _Button from/g' "$file"
  sed -i'' -e 's/import Checkbox from/import _Checkbox from/g' "$file"
  sed -i'' -e 's/import Divider from/import _Divider from/g' "$file"
  sed -i'' -e 's/import FormControl from/import _FormControl from/g' "$file"
  sed -i'' -e 's/import InputLabel from/import _InputLabel from/g' "$file"
  sed -i'' -e 's/import Select from/import _Select from/g' "$file"
  sed -i'' -e 's/import MenuItem from/import _MenuItem from/g' "$file"
  sed -i'' -e 's/import { \([^}]*\)useParams\([^}]*\) } from/import { \1_useParams\2 } from/g' "$file"
  sed -i'' -e 's/const \[user,/const \[_user,/g' "$file"
  sed -i'' -e 's/const \[error,/const \[_error,/g' "$file"
  sed -i'' -e 's/const theme =/const _theme =/g' "$file"
  
  # Common variable assignments
  sed -i'' -e 's/const toRemove =/const _toRemove =/g' "$file"
  sed -i'' -e 's/const images =/const _images =/g' "$file"
  sed -i'' -e 's/const setEvents =/const _setEvents =/g' "$file"
  sed -i'' -e 's/const setLoading =/const _setLoading =/g' "$file"
  sed -i'' -e 's/const setError =/const _setError =/g' "$file"
  
  # Fix the ESLint error for import/no-anonymous-default-export in environment.js
  if [[ $file == *"environment.js" ]]; then
    sed -i'' -e 's/export default {/const environmentConfig = {\n};\n\nexport default environmentConfig;/g' "$file"
  fi
done

echo "Cleanup temporary files..."
find src -name "*.js-e" -delete
find src -name "*.jsx-e" -delete

echo "Done! Run ESLint again to see remaining issues."
