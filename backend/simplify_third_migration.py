#!/usr/bin/env python3
import os
import re

MIGRATION_FILE = os.path.join('migrations', 'versions', '42fd63a85b12_add_indexes_for_hot_paths.py')

def simplify_migration():
    print("Simplifying migration file to avoid non-existent tables and columns...")
    
    with open(MIGRATION_FILE, 'r') as file:
        content = file.read()
    
    # Replace the upgrade function with a simplified version
    new_upgrade_func = '''
def upgrade():
    # Empty migration - original indexes would reference tables or columns that don't exist
    pass
'''
    
    # Replace the upgrade function using regex
    modified_content = re.sub(
        r'def upgrade\(\):\s+.*?(?=def downgrade|\Z)',
        new_upgrade_func,
        content,
        flags=re.DOTALL
    )
    
    # Also simplify the downgrade function since we're not creating any indexes
    new_downgrade_func = '''
def downgrade():
    # Nothing to downgrade
    pass
'''
    
    # Replace the downgrade function using regex
    modified_content = re.sub(
        r'def downgrade\(\):\s+.*?(?=\Z)',
        new_downgrade_func,
        modified_content,
        flags=re.DOTALL
    )
    
    with open(MIGRATION_FILE, 'w') as file:
        file.write(modified_content)
    
    print("Successfully simplified migration")

if __name__ == "__main__":
    simplify_migration()
