#!/usr/bin/env python3
"""
This script completely rewrites the migration file to remove all problematic constraint drops.
"""
import re
import sys
import os
from pathlib import Path


def fix_migration_file():
    """Fix the migration file by removing all problematic constraint drops."""
    # Path to the migration file
    backend_dir = Path(__file__).parent
    migration_file = backend_dir / "migrations" / "versions" / "8a6b5a055408_update_schema.py"
    
    if not migration_file.exists():
        print(f"Error: Migration file not found at {migration_file}")
        return False
    
    # Create a backup of the original file
    backup_path = f"{migration_file}.final_backup"
    with open(migration_file, 'r') as src, open(backup_path, 'w') as dst:
        dst.write(src.read())
    print(f"Created backup at {backup_path}")
    
    # Read the migration file
    with open(migration_file, 'r') as f:
        lines = f.readlines()
    
    # New content without problematic lines
    new_lines = []
    skip_line = False
    skip_try_except_block = False
    try_depth = 0
    
    for line in lines:
        # Skip lines with drop_constraint(None)
        if "drop_constraint(None" in line or "drop_constraint(''" in line:
            skip_line = True
            # Instead, add a comment
            new_lines.append("        # Removed problematic constraint drop\n")
            continue
        
        # Handle try/except blocks containing drop_constraint
        if "try:" in line.strip() and not skip_try_except_block:
            try_depth += 1
        
        # If this is a complex try/except block with drop_constraint, skip it
        if try_depth > 1 and "batch_op.drop_constraint" in line:
            skip_try_except_block = True
            try_depth = 0
            new_lines.append("        # Removed problematic nested try/except block for constraint drop\n")
            continue
        
        # Handle except blocks
        if "except" in line.strip() and skip_try_except_block:
            continue
        
        # Reset the skip flag after the line
        if skip_line:
            skip_line = False
            continue
            
        # Add the line if we're not skipping it
        if not skip_try_except_block:
            new_lines.append(line)
    
    # Write the fixed content
    with open(migration_file, 'w') as f:
        f.writelines(new_lines)
    
    print(f"Successfully fixed {migration_file}")
    return True


def main():
    """Main entry point for the script."""
    # Fix the file
    if fix_migration_file():
        print("Migration file fixed successfully!")
        print("Now you can run the migration tests")
        return 0
    else:
        print("Failed to fix migration file")
        return 1


if __name__ == "__main__":
    sys.exit(main())
