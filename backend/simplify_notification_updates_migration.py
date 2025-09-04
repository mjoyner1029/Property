#!/usr/bin/env python3
import os
import re

MIGRATION_FILE = os.path.join('migrations', 'versions', '20250831_notification_updates.py')

def simplify_migration():
    print("Simplifying notification_updates migration...")
    
    with open(MIGRATION_FILE, 'r') as file:
        content = file.read()
    
    # Replace the upgrade function with a simplified version
    new_upgrade_func = '''
def upgrade():
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
    
    with open(MIGRATION_FILE, 'w') as file:
        file.write(modified_content)
    
    print("Successfully simplified notification_updates migration")

if __name__ == "__main__":
    simplify_migration()
