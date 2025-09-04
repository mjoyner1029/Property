#!/usr/bin/env python3
import os
import re

MIGRATION_FILE = os.path.join('migrations', 'versions', 'abc123456789_create_stripe_event_table.py')

def simplify_migration():
    print("Simplifying stripe_events table creation migration...")
    
    with open(MIGRATION_FILE, 'r') as file:
        content = file.read()
    
    # Replace the upgrade function with a simplified version that skips creating the table
    new_upgrade_func = '''
def upgrade():
    # Skip creating stripe_events table as it was already created in previous migration
    # Just create the indexes
    op.create_index('ix_stripe_events_event_id', 'stripe_events', ['event_id'], unique=True)
    op.create_index('ix_stripe_events_event_type', 'stripe_events', ['event_type'], unique=False)

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
    
    print("Successfully simplified stripe_events table creation migration")

if __name__ == "__main__":
    simplify_migration()
