#!/usr/bin/env python3
"""
This script removes the problematic constraint drop calls that are causing the migration to fail.
"""
import re
import sys
from pathlib import Path

def fix_migration_file(file_path):
    # Read the file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern to find the problematic lines
    pattern = r'batch_op\.drop_constraint\(None, type_=\'foreignkey\'\)'
    
    # Count matches
    matches = re.findall(pattern, content)
    if not matches:
        print(f"No problematic constraints found in {file_path}")
        return False

    # Replace with a comment
    new_content = content.replace(pattern, 
                                 "# Removed constraint drop due to missing constraint name - this line was: batch_op.drop_constraint(None, type_='foreignkey')")
    
    # Create a backup
    backup_path = f"{file_path}.bak"
    with open(backup_path, 'w') as f:
        f.write(content)
    
    # Write the fixed content
    with open(file_path, 'w') as f:
        f.write(new_content)
    
    print(f"Fixed {len(matches)} constraint issues in {file_path}")
    print(f"Backup saved to {backup_path}")
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
