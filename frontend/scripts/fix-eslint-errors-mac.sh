#!/bin/bash
# Script to fix common ESLint errors in the frontend codebase for macOS

# Theme imports fix
find src -type f \( -name "*.js" -o -name "*.jsx" \) | xargs grep -l "theme" | while read file; do
  if ! grep -q "import { useTheme } from '@mui/material/styles';" "$file" && grep -q "theme" "$file"; then
    echo "Adding useTheme import to $file"
    sed -i '' -e '/^import/a\\
import { useTheme } from '"'"'@mui/material/styles'"'"';
' "$file"
    
    # Check if the file has a functional component and add theme constant
    if grep -q "function " "$file" || grep -q "const.*=.*(" "$file" || grep -q "export default.*=.*(" "$file"; then
      if ! grep -q "const theme = useTheme" "$file"; then
        FUNC_LINE=$(grep -n -m 1 -E "function |const.*=.*\(|export default.*=.*\(" "$file" | cut -d: -f1)
        if [ -n "$FUNC_LINE" ]; then
          BRACKET_LINE=$((FUNC_LINE + 1))
          sed -i '' -e "${BRACKET_LINE}i\\
  const theme = useTheme();
" "$file"
        fi
      fi
    fi
  fi
done

# Error variable fix for context files
find src/context -type f \( -name "*.js" -o -name "*.jsx" \) | xargs grep -l "error" | while read file; do
  if grep -q "catch.*{" "$file" && ! grep -q "const \[error, setError\]" "$file"; then
    echo "Adding error state to $file"
    FUNC_LINE=$(grep -n -m 1 -E "const \[[a-zA-Z]+" "$file" | tail -1 | cut -d: -f1)
    if [ -n "$FUNC_LINE" ]; then
      sed -i '' -e "${FUNC_LINE}a\\
  const [error, setError] = useState(null);
" "$file"
    fi
  fi
done

# useParams import fix
find src -type f \( -name "*.js" -o -name "*.jsx" \) | xargs grep -l "useParams" | while read file; do
  if ! grep -q "import {.*useParams.*} from 'react-router-dom';" "$file" && grep -q "useParams" "$file"; then
    echo "Adding useParams import to $file"
    if grep -q "import {.*} from 'react-router-dom';" "$file"; then
      # Add useParams to existing react-router-dom import
      sed -i '' -e "s/import {/import { useParams, /g" "$file"
    else
      # Add new import line
      sed -i '' -e '/^import/a\\
import { useParams } from '"'"'react-router-dom'"'"';
' "$file"
    fi
  fi
done

# useEffect import fix
find src -type f \( -name "*.js" -o -name "*.jsx" \) | xargs grep -l "useEffect" | while read file; do
  if ! grep -q "import {.*useEffect.*} from 'react';" "$file" && ! grep -q "import React, {.*useEffect.*} from 'react';" "$file" && ! grep -q "import React from 'react';" "$file" && grep -q "useEffect" "$file"; then
    echo "Adding useEffect import to $file"
    if grep -q "import {.*} from 'react';" "$file"; then
      # Add useEffect to existing React import
      sed -i '' -e "s/import {/import { useEffect, /g" "$file"
    elif grep -q "import React from 'react';" "$file"; then
      # Convert to React, { useEffect } format
      sed -i '' -e "s/import React from 'react';/import React, { useEffect } from 'react';/g" "$file"
    else
      # Add new import line
      sed -i '' -e '/^import/a\\
import { useEffect } from '"'"'react'"'"';
' "$file"
    fi
  fi
done

echo "Fixes applied. Run 'npx eslint src' to check for remaining issues."
