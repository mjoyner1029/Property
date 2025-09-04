#!/usr/bin/env python3
"""
This script completely fixes the problematic migration file by removing all
drop_constraint calls that don't have a name.
"""
import re
import sys
import os
from pathlib import Path
import shutil


def fix_migration_file(file_path):
    """Fix the migration file by replacing problematic constraint drops."""
    # Create a backup of the original file
    backup_path = f"{file_path}.bak2"
    shutil.copy2(file_path, backup_path)
    print(f"Created backup at {backup_path}")
    
    # Read the migration file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Patterns to identify problematic sections with try/except blocks
    pattern1 = r'try:(\s+)try:(\s+)try:(\s+)try:(\s+)try:(\s+)batch_op\.drop_constraint\(None[^}]+?except[^}]+?except[^}]+?except[^}]+?except[^}]+?except[^}]+?'
    pattern2 = r'try:(\s+)try:(\s+)try:(\s+)batch_op\.drop_constraint\(None[^}]+?except[^}]+?except[^}]+?except[^}]+?'
    
    # Replace with a comment
    replacement = "        # Removed problematic constraint drop code\n"
    
    # First pass: replace complex try/except blocks
    new_content = re.sub(pattern1, replacement, content, flags=re.DOTALL)
    new_content = re.sub(pattern2, replacement, new_content, flags=re.DOTALL)
    
    # Second pass: replace individual constraint drop calls
    new_content = re.sub(
        r'batch_op\.drop_constraint\(None, type_=\'foreignkey\'\)',
        '# batch_op.drop_constraint(None, type_=\'foreignkey\')',
        new_content
    )
    
    # Third pass: replace any remaining try/except blocks that might be broken
    new_content = re.sub(
        r'try:(\s+)batch_op\.drop_constraint\(None[^}]+?except[^}]+?',
        replacement,
        new_content,
        flags=re.DOTALL
    )
    
    # Write the fixed content
    with open(file_path, 'w') as f:
        f.write(new_content)
    
    print(f"Successfully fixed {file_path}")
    return True


def main():
    """Main entry point for the script."""
    # Path to the migration file
    backend_dir = Path(__file__).parent
    migration_file = backend_dir / "migrations" / "versions" / "8a6b5a055408_update_schema.py"
    
    if not migration_file.exists():
        print(f"Error: Migration file not found at {migration_file}")
        return 1
    
    # Fix the file
    if fix_migration_file(migration_file):
        print("Migration file fixed successfully!")
        print("Now you can run the migration tests")
        return 0
    else:
        print("Failed to fix migration file")
        return 1


if __name__ == "__main__":
    sys.exit(main())
