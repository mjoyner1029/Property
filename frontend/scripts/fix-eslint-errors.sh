#!/bin/bash

cd /Users/mjoyner/Property/frontend

echo "Fixing theme imports and other common issues..."

# Add theme imports to files
find src -type f \( -name "*.js" -o -name "*.jsx" \) | xargs grep -l "theme.*:" | while read file; do
  if ! grep -q "import { useTheme } from " "$file"; then
    # Check if there's already any import from @mui/material
    if grep -q "import.*from '@mui/material';" "$file"; then
      # Add useTheme to existing import
      sed -i'' -E 's/import \{([^}]*)\} from '"'"'@mui\/material'"'"';/import \{\1, useTheme\} from '"'"'@mui\/material'"'"';/g' "$file"
    else
      # Add new import at the top of imports section
      sed -i'' -e '/^import/i import { useTheme } from '"'"'@mui/material'"'"';' "$file"
    fi
    
    # Add theme initialization
    sed -i'' -e '/^function/i const theme = useTheme();' "$file"
    sed -i'' -e '/^const.*= (props) =>/i const theme = useTheme();' "$file"
    sed -i'' -e '/^const.*= () =>/i const theme = useTheme();' "$file"
  fi
done

# Add icon imports
find src -type f \( -name "*.js" -o -name "*.jsx" \) | xargs grep -l "HomeIcon" | while read file; do
  if ! grep -q "import HomeIcon from " "$file"; then
    sed -i'' -e '/^import/i import HomeIcon from '"'"'@mui/icons-material/Home'"'"';' "$file"
  fi
done

find src -type f \( -name "*.js" -o -name "*.jsx" \) | xargs grep -l "FilterListIcon" | while read file; do
  if ! grep -q "import FilterListIcon from " "$file"; then
    sed -i'' -e '/^import/i import FilterListIcon from '"'"'@mui/icons-material/FilterList'"'"';' "$file"
  fi
done

# Add useParams imports
find src -type f \( -name "*.js" -o -name "*.jsx" \) | xargs grep -l "useParams" | while read file; do
  if ! grep -q "import.*useParams.*from " "$file"; then
    # Check if there's already any import from react-router-dom
    if grep -q "import.*from 'react-router-dom';" "$file"; then
      # Add useParams to existing import
      sed -i'' -E 's/import \{([^}]*)\} from '"'"'react-router-dom'"'"';/import \{\1, useParams\} from '"'"'react-router-dom'"'"';/g' "$file"
    else
      # Add new import
      sed -i'' -e '/^import/i import { useParams } from '"'"'react-router-dom'"'"';' "$file"
    fi
  fi
done

# Add useEffect imports
find src -type f \( -name "*.js" -o -name "*.jsx" \) | xargs grep -l "useEffect" | while read file; do
  if ! grep -q "import.*useEffect.*from 'react';" "$file"; then
    # Check if there's already any import from react
    if grep -q "import.*from 'react';" "$file"; then
      # Add useEffect to existing import
      sed -i'' -E 's/import ([^{]*)\{([^}]*)\} from '"'"'react'"'"';/import \1\{\2, useEffect\} from '"'"'react'"'"';/g' "$file"
    else
      # Add new import
      sed -i'' -e '/^import/i import { useEffect } from '"'"'react'"'"';' "$file"
    fi
  fi
done

# Clean up temporary files
echo "Cleaning up temporary files..."
find src -name "*.js-e" -delete
find src -name "*.jsx-e" -delete

echo "Done! Many common issues should be fixed. Run ESLint again to see remaining issues."
