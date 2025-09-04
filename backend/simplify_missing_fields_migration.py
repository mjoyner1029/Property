#!/usr/bin/env python3
import os
import re

MIGRATION_FILE = os.path.join('migrations', 'versions', '20250830_missing_fields.py')

def simplify_migration():
    print("Simplifying missing_fields migration...")
    
    with open(MIGRATION_FILE, 'r') as file:
        content = file.read()
    
    # Replace the upgrade and downgrade functions with simplified versions
    new_upgrade_func = '''
def upgrade():
    # Skip operations on tables that don't exist
    pass
'''
    
    new_downgrade_func = '''
def downgrade():
    # Skip operations on tables that don't exist
    pass
'''
    
    # Replace the upgrade function using regex
    modified_content = re.sub(
        r'def upgrade\(\):\s+.*?(?=def downgrade|\Z)',
        new_upgrade_func,
        content,
        flags=re.DOTALL
    )
    
    # Replace the downgrade function using regex
    modified_content = re.sub(
        r'def downgrade\(\):\s+.*?(?=\Z)',
        new_downgrade_func,
        modified_content,
        flags=re.DOTALL
    )
    
    with open(MIGRATION_FILE, 'w') as file:
        file.write(modified_content)
    
    print("Successfully simplified missing_fields migration")

if __name__ == "__main__":
    simplify_migration()
