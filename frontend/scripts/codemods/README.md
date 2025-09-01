# Test Import Codemods

This directory contains codemods for maintaining and refactoring the test codebase.

## Available Codemods

### tests-absolute-imports.js

Converts relative imports in test files to absolute imports starting with `src/`.

**Before:**
```javascript
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
```

**After:**
```javascript
import { useAuth } from 'src/contexts/AuthContext';
import { Button } from 'src/components/ui/Button';
```

**Usage:**
```bash
# Make sure you have the required dependencies
npm install -g glob

# Navigate to the frontend directory
cd frontend

# Run the codemod
node scripts/codemods/tests-absolute-imports.js
```
