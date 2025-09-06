# Implementation and Testing Guide

## Step 1: Backup your current migrations directory

```bash
cd /Users/mjoyner/Property/backend
cp -r migrations migrations.bak
```

## Step 2: Apply the fixes in the correct order

1. First, fix the revision ID in a1b2c3d4e5f6_add_alias_square_feet.py:

```python
# Change from
revision = 'a1b2c3d4e5f6_alias'
# To
revision = 'a1b2c3d4e5f6'
```

2. Fix the circular reference in 20250819_1430_noop.py:

```python
# Change from
down_revision = '7d4e5f6g7h8i'
# To
down_revision = '9a7c4d21e508'
```

3. Create the missing maintenance_requests table migration:
   - Create a new file: 8a6b5a055408_maintenance_create_table.py
   - Add the table creation code as shown in our fix

4. Update the add_maintenance_type migration:

```python
# Change from
down_revision = '8a6b5a055408'
# To
down_revision = '8a6b5a055408_maintenance'
```

5. Fix the merge migration in 20250903_merge_heads.py:

```python
# Change from
down_revision = ('20250831_notification_updates', 'a1b2c3d4e5f6_alias')
# To
down_revision = ('20250831_notification_updates', '7d4e5f6g7h8i')
```

## Step 3: Verify the changes

```bash
cd /Users/mjoyner/Property/backend
flask db heads
```

This should output `20250903_merge_heads (head)`, confirming there's only one head.

## Step 4: Test with SQLite

If you need to verify SQLite compatibility:

```bash
cd /Users/mjoyner/Property/backend
flask db upgrade --sql
```

This will output the SQL that would be executed. Look for any SQLite incompatibilities.

## Step 5: Run Database Upgrade (if needed)

Once you've verified the migration chain is correct:

```bash
cd /Users/mjoyner/Property/backend
flask db upgrade
```

## Step 6: Commit the changes

```bash
git add migrations/versions/
git commit -m "Fix migration chain: Linearized history, fixed circular references, added missing maintenance_requests table"
```

## Troubleshooting

If you encounter issues:

1. **New errors after applying fixes**:
   - Check if all references to a1b2c3d4e5f6_alias have been replaced
   - Verify there are no other circular references

2. **SQLite compatibility issues**:
   - Use batch_alter_table for all ALTER TABLE operations
   - Add table existence checks before operations

3. **Multiple heads still exist**:
   - Run `flask db heads` to identify the remaining heads
   - Create an additional merge migration if needed
