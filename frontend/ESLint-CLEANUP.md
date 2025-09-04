# ESLint Cleanup Plan

## Progress Made

1. **ESLint configuration updated**:
   - Added configuration to allow unused variables prefixed with underscore
   - Added this rule to both global and test files

2. **Fixed unused variable warnings**:
   - Renamed/commented unused variables in key files like:
     - `/frontend/src/api/api.js`
     - `/frontend/src/utils/api.js`
     - `/frontend/src/utils/authApi.js`
     - `/frontend/src/components/ErrorBoundary.jsx`
     - `/frontend/src/components/Layout.jsx`
     - `/frontend/src/__tests__/tenants/TenantContextTests.jsx`
     - `/frontend/src/observability/sentry.js`

3. **Fixed environment export**:
   - Fixed the formatting in `environment.js` which was causing syntax errors

## Remaining Issues

### 1. Theme-related errors
Many components use `theme` without importing it, for example:
```jsx
// src/components/Chart.jsx
Line 42:23:  'theme' is not defined  no-undef
```
**Solution**: Add theme import from Material UI in affected files

### 2. Icon imports
Multiple files reference icons that aren't imported:
```jsx
// src/components/PropertyCard.jsx
Line 16:15:  'HomeIcon' is not defined  react/jsx-no-undef
```
**Solution**: Import missing icons from MUI

### 3. 'error' variables
Multiple files reference 'error' variables that aren't defined:
```jsx
// src/pages/ForgotPassword.jsx
Line 63:12:  'error' is not defined  no-undef
```
**Solution**: Define error variables or fix the error handling

### 4. 'useParams' hooks
Multiple files reference React Router's useParams without importing it:
```jsx
// src/pages/PropertyForm.jsx
Line 31:18:  'useParams' is not defined  no-undef
```
**Solution**: Import useParams from react-router-dom

### 5. Test file issues
- Many test files have references to `getInputByName` which is not defined
- Several tests have test-library related issues like using direct node access

### 6. React Hooks Rules
Some mock files break the rules of hooks:
```jsx
// src/context/__mocks__/MaintenanceContext.js
Line 32:33: React Hook "useMaintenanceContext" is called conditionally
```

## Next Steps for Complete Cleanup

1. **Theme fix**: 
   - Add `useTheme` imports 
   - Replace direct theme references with the imported theme

2. **Missing imports**:
   - Add required imports for HomeIcon, FilterListIcon, and other icons
   - Add useParams imports where needed
   - Add useEffect imports where needed

3. **Error variables**:
   - Define error variables or restructure error handling code

4. **For test files**:
   - Import and define getInputByName or refactor tests
   - Fix react-testing-library rule violations

5. **Hook Rules**:
   - Fix conditional hook calls in mock files

## Running the Fixes

The suggested approach is to tackle these issues category by category:

1. First add all missing theme imports
2. Then add icon imports 
3. Then handle error and hook references
4. Finally address testing-specific issues

This methodical approach will make the codebase more maintainable and improve CI processes.
