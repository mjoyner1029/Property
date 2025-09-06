# Migration Fixes

Here's the plan to fix the migration issues:

1. First, let's fix circular references and incorrect down_revisions
2. Then create a proper merge migration
3. Finally ensure SQLite safety

## Step 1: Fix Circular References and Incorrect Down Revisions

### Fix 1: a1b2c3d4e5f6_add_alias_square_feet.py

The file indicates its down_revision should be '9a7c4d21e508' but it's currently set to '20250831_add_field_aliases'.
This file's revision is 'a1b2c3d4e5f6_alias' but referenced as 'a1b2c3d4e5f6' in other files.

```python
# Original
revision = 'a1b2c3d4e5f6_alias'
down_revision = '20250831_add_field_aliases'  # Replace with your actual down_revision

# Fix
revision = 'a1b2c3d4e5f6'  # Remove _alias suffix for consistency
down_revision = '20250831_add_field_aliases'  # This is correct based on the chain
```

### Fix 2: Fix 20250831_notification_updates.py

Currently it points to a1b2c3d4e5f6 as its down_revision, which is correct if we update the a1b2c3d4e5f6 file's revision ID to match.

```python
# Already correct if we fix a1b2c3d4e5f6_add_alias_square_feet.py
revision = '20250831_notification_updates'
down_revision = 'a1b2c3d4e5f6'
```

### Fix 3: 42fd63a85b12_add_indexes_for_hot_paths.py

The down_revision is set to '9a7c4d21e508', but it's also referenced by 7d4e5f6g7h8i which points to 20250820_noop, which points to 42fd63a85b12.

```python
# Current:
revision = '42fd63a85b12'
down_revision = '9a7c4d21e508'

# This looks correct - it should point to 9a7c4d21e508
```

### Fix 4: 7d4e5f6g7h8i_verify_migrations_process.py

```python
# Current:
revision = "7d4e5f6g7h8i"
down_revision = '20250820_noop'

# This seems correct - it points to 20250820_noop
```

### Fix 5: 20250819_1430_noop.py

```python
# Current:
revision = "20250819_1430_noop"
down_revision = '7d4e5f6g7h8i'

# This creates a circular reference since 7d4e5f6g7h8i points to 20250820_noop
# Change to:
down_revision = '9a7c4d21e508'  # This will create a branch
```

## Step 2: Create a Proper Merge Migration

After fixing the circular references, we'll have two clear branches with these heads:
1. 7d4e5f6g7h8i (from the first branch)
2. 20250831_notification_updates (from the second branch)

We need to fix the merge migration to properly reference these heads:

```python
# In 20250903_merge_heads.py
revision = '20250903_merge_heads'
down_revision = ('20250831_notification_updates', '7d4e5f6g7h8i')
```

## Step 3: Ensure SQLite Safety

For the maintenance_requests table and the maintenance_type column, we need to make sure:

1. Check that 8a6b5a055408_update_schema.py properly creates the maintenance_requests table
2. Check that 9a7c4d21e508_add_maintenance_type.py properly adds the maintenance_type column with SQLite safety checks

SQLite doesn't support ALTER TABLE as flexibly as PostgreSQL, so we need to ensure:
- Each migration uses "if exists" checks before modifying tables
- ALTER TABLE statements are compatible with SQLite
