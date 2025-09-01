# Snapshot and Query Refactoring

This document outlines the work done to replace fragile snapshots and text-based queries with more semantic role-based assertions in our test suite.

## Goals

1. Replace fragile `.toMatchSnapshot()` assertions with semantic assertions about component behavior
2. Replace ambiguous text queries (`getByText`) with more semantic role-based queries (`getByRole`, `getByLabelText`)
3. Remove obsolete snapshot files
4. Update stable snapshots only after rewriting to stable markup

## Approach

We used a systematic approach to identify and fix the issues:

1. Created a script (`scripts/role-based-assertions.js`) to identify test files using text-based queries
2. Prioritized files with the lowest "role ratio" (those most dependent on text queries)
3. For each file:
   - Replaced `getByText` with appropriate role-based queries where possible
   - Added appropriate aria attributes to components if needed
   - Verified tests still pass

## Benefits

1. **More stable tests**: Role-based queries are less likely to break due to trivial UI changes
2. **Better accessibility**: By focusing on roles and labels, we naturally improve accessibility
3. **Better error messages**: Role-based queries provide better error messages when tests fail
4. **Follows best practices**: Aligns with Testing Library's recommended query priority

## Progress

| File | Status | Notes |
|------|--------|-------|
| ErrorBoundary.test.jsx | ✅ | Converted to use `getByRole('heading')` and `getByRole('button')` |
| VerifyEmail.test.jsx | ✅ | Fixed React reference in jest.mock and improved queries |
| Card.test.jsx | ✅ | Converted to use `getByRole('heading')` and improved container queries |
| Empty.test.jsx | ✅ | Converted to use `getByRole('heading')` and `getByRole('button')` |

## Next Steps

Continue working through the files identified by the script, prioritizing:

1. Components/NotificationBadge.test.jsx
2. Components/StatusBadge.test.jsx
3. Dashboard/AdminDashboard.test.jsx
4. Layout/NavBarSimple.test.jsx

## Resources

- [Testing Library Query Priority](https://testing-library.com/docs/queries/about/#priority)
- [Common Accessibility Roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)
