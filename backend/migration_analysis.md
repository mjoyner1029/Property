# Migration Chain Analysis

## Current Migration Chain

Based on the files in the migrations/versions directory, here's the current state:

```
682dc312c919_initial_schema.py (down_revision = None)
↓
8a6b5a055408_update_schema.py (down_revision = '682dc312c919') - Creates maintenance_requests table
↓
9a7c4d21e508_add_maintenance_type.py (down_revision = '8a6b5a055408') - Adds column to maintenance_requests
↓
Branch 1:                                              Branch 2:
42fd63a85b12_add_indexes_for_hot_paths.py             20250819_1430_noop.py 
(down_revision = '9a7c4d21e508')                      (down_revision = '7d4e5f6g7h8i')
↓                                                     ↓
20250820_noop.py                                      20250825_money_and_stripe_events.py
(down_revision = '42fd63a85b12')                      (down_revision = '20250819_1430_noop')
↓                                                     ↓
7d4e5f6g7h8i_verify_migrations_process.py            abc123456789_create_stripe_event_table.py
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
```

## Issues Identified

1. **Circular Reference**: 
   - `20250831_notification_updates.py` points to `a1b2c3d4e5f6` as its down_revision
   - But `a1b2c3d4e5f6_add_alias_square_feet.py` points to `20250831_add_field_aliases` as its down_revision
   - The revision IDs don't match the filename in some cases (missing `_alias` suffix in the actual revision ID)

2. **Multiple Heads**:
   - We have two branches, causing multiple heads
   - There's an attempted merge migration (`20250903_merge_heads.py`), but it's not correctly referencing the actual heads

3. **Revision Ordering Issue**:
   - `7d4e5f6g7h8i` and `20250819_1430_noop` reference each other circularly
   - Some migrations use date-based naming (20250831_*) while others use hash-based naming

## Plan to Fix

1. **Fix Circular References**:
   - Update `a1b2c3d4e5f6_add_alias_square_feet.py` to use the correct down_revision (matching the chain)
   - Ensure all revision IDs match the intended version pattern

2. **Create a proper merge migration**:
   - Identify the true heads of each branch
   - Create a merge migration that properly references both heads

3. **SQLite Safety**:
   - Check if maintenance_requests table is created before the migration that adds maintenance_type
   - Ensure all migrations use SQLite-compatible code
