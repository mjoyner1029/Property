# fix(models): add square_feet alias and migration

## Problem
Tests and services use `square_feet` while the database columns use different names:
- `Property` model has `square_footage`
- `Unit` model has `size`

This causes attribute errors when tests attempt to set or access `square_feet`.

## Solution
1. Added `@property` getters and setters for `square_feet` in both models:
   - `Property.square_feet` -> maps to `square_footage`
   - `Unit.square_feet` -> maps to `size`

2. Updated `to_dict()` methods to include both original and alias property names:
   - `Property.to_dict()` now includes both `square_footage` and `square_feet`
   - `Unit.to_dict()` now includes both `size` and `square_feet`

3. Added a migration file to document these changes (Python-level only, no DB schema changes)

## Testing
- Verified that tests using `square_feet` now work correctly with both models
- Verified that the API response includes both field names for backward compatibility

## Acceptance Criteria
- Tests referencing `square_feet` compile and run without attribute errors
- Migration compiles
- No database schema changes were required
