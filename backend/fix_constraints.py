#!/usr/bin/env python3
"""
This script replaces all instances of `batch_op.drop_constraint(None, type_='foreignkey')`
with safer code that won't fail if the constraint is missing or has no name.
"""
import re
import sys
from pathlib import Path

def fix_migration_file(file_path):
    # Read the file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Count the replacements before making them
    pattern = r'batch_op\.drop_constraint\(None, type_=\'foreignkey\'\)'
    matches = re.findall(pattern, content)
    if not matches:
        print(f"No problematic constraints found in {file_path}")
        return False

    # Create safe replacement block
    safe_code = """try:
            batch_op.drop_constraint(None, type_='foreignkey')
        except (ValueError, Exception) as e:
            print(f"INFO: Skipping constraint drop: {e}")"""
    
    # Replace all instances
    new_content = re.sub(pattern, safe_code, content)
    
    # Save the file
    with open(file_path, 'w') as f:
        f.write(new_content)
    
    print(f"Fixed {len(matches)} constraint issues in {file_path}")
    return True

def main():
    # Get all migration files
    backend_dir = Path(__file__).parent
    migrations_dir = backend_dir / "migrations" / "versions"
    
    # Check if update_schema file exists
    update_schema_files = list(migrations_dir.glob("*_update_schema.py"))
    if not update_schema_files:
        print("No update_schema.py file found")
        return 1
    
    # Fix each file
    fixed = False
    for file_path in update_schema_files:
        if fix_migration_file(file_path):
            fixed = True
    
    if fixed:
        print("Successfully fixed migration files")
        return 0
    else:
        print("No changes were made")
        return 0

if __name__ == "__main__":
    sys.exit(main())
