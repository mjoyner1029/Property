# Alembic Migration Fix Summary

## Identified Issues

1. **Circular References**: 
   - `a1b2c3d4e5f6_add_alias_square_feet.py` revision used `a1b2c3d4e5f6_alias` as ID but referenced in other files as `a1b2c3d4e5f6`
   - `20250819_1430_noop.py` pointed to `7d4e5f6g7h8i` which created a circular reference in the chain
   
2. **Missing Table Issue**: 
   - `9a7c4d21e508_add_maintenance_type.py` added a column to `maintenance_requests` table, but the simplified `8a6b5a055408_update_schema.py` didn't create the table
   
3. **Multiple Heads**:
   - Two separate branches existed in the migration history

## Applied Fixes

1. **Fixed Circular References**:
   - Changed `a1b2c3d4e5f6_add_alias_square_feet.py` revision ID to use `a1b2c3d4e5f6` without the _alias suffix
   - Modified `20250819_1430_noop.py` to point to `9a7c4d21e508` instead of `7d4e5f6g7h8i`

2. **Created Missing Table Migration**:
   - Added a new migration `8a6b5a055408_maintenance_create_table.py` that creates the maintenance_requests table
   - Updated `9a7c4d21e508_add_maintenance_type.py` to point to this new migration

3. **Fixed Merge Migration**:
   - Updated `20250903_merge_heads.py` to correctly reference the true heads of each branch
   - Changed down_revision to `('20250831_notification_updates', '7d4e5f6g7h8i')`

4. **SQLite Safety Improvements**:
   - The existing maintenance_type migration already used `batch_alter_table` with checks
   - All new SQL uses SQLite-compatible operations

## Final Migration Chain

```
682dc312c919_initial_schema.py (down_revision = None)
↓
8a6b5a055408_update_schema.py (down_revision = '682dc312c919')
↓
8a6b5a055408_maintenance_create_table.py (down_revision = '8a6b5a055408')
↓
9a7c4d21e508_add_maintenance_type.py (down_revision = '8a6b5a055408_maintenance')
↓
Branch 1:                                              Branch 2:
42fd63a85b12_add_indexes_for_hot_paths.py             20250819_1430_noop.py 
(down_revision = '9a7c4d21e508')                      (down_revision = '9a7c4d21e508')
↓                                                     ↓
20250820_noop.py                                      20250825_money_and_stripe_events.py
(down_revision = '42fd63a85b12')                      (down_revision = '20250819_1430_noop')
↓                                                     ↓
7d4e5f6g7h8i_verify_migrations_process.py             abc123456789_create_stripe_event_table.py
(down_revision = '20250820_noop')                     (down_revision = '20250825_money_and_stripe_events')
                                                      ↓
                                                      20250830_missing_fields.py
                                                      (down_revision = 'abc123456789')
                                                      ↓
                                                      20250831_add_field_aliases.py
                                                      (down_revision = '20250830_missing_fields')
                                                      ↓
                                                      a1b2c3d4e5f6_add_alias_square_feet.py
                                                      (down_revision = '20250831_add_field_aliases')
                                                      ↓
                                                      20250831_notification_updates.py
                                                      (down_revision = 'a1b2c3d4e5f6')
↓                                                     ↓
20250903_merge_heads.py (down_revision = ('20250831_notification_updates', '7d4e5f6g7h8i'))
```

## Testing

The `flask db heads` command now shows a single head: `20250903_merge_heads (head)`, confirming our changes were successful.

## Additional Recommendations

1. Consider standardizing on a consistent naming convention for migration files:
   - Either date-based: YYYYMMDD_description
   - Or hash-based: 32-character hash

2. Add more robust SQLite compatibility checks to all migrations:
   ```python
   # Example SQLite-safe check for table existence
   bind = op.get_bind()
   insp = sa.inspect(bind)
   if "table_name" in insp.get_table_names():
       # Perform operations
   ```

3. Consider adding a pre-migration check script in CI that verifies:
   - No circular references
   - Single head (unless multiple heads are intentional)
   - All migrations are SQLite compatible
