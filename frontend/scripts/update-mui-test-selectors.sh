#!/bin/bash

# This script will update all test files to use the new MUI testing utilities
# for more reliable component selection in tests.

# Navigate to project root
cd "$(dirname "$0")/.."

# Update imports in all test files
find ./src/__tests__ -name "*.test.jsx" -exec sed -i '' '1,10s/import { screen,/import { screen, within,/g' {} \;
find ./src/__tests__ -name "*.test.jsx" -exec sed -i '' '1,20s/} from '\''@testing-library\/react'\'';/} from '\''@testing-library\/react'\'';\nimport { getInputByName, getSelectByName } from '\''src\/test\/utils\/muiTestUtils'\'';/g' {} \;

# Replace getByLabelText with getInputByName for textbox inputs
find ./src/__tests__ -name "*.test.jsx" -exec sed -i '' 's/screen\.getByLabelText(\([^)]*\))/getInputByName(\1)/g' {} \;

# Handle cases where within() is used with getByLabelText
find ./src/__tests__ -name "*.test.jsx" -exec sed -i '' 's/within([^)]*)\.getByLabelText(\([^)]*\))/getInputByName(\1)/g' {} \;

echo "Updated test files to use MUI testing utilities"
