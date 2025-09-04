#!/usr/bin/env python3
import os
import re

MIGRATION_FILE = os.path.join('migrations', 'versions', '20250825_money_and_stripe_events.py')

def simplify_migration():
    print("Simplifying money_and_stripe_events migration...")
    
    with open(MIGRATION_FILE, 'r') as file:
        content = file.read()
    
    # Replace the upgrade function with a simplified version that only creates the stripe_events table
    new_upgrade_func = '''
def upgrade():
    # stripe_events table if not exists
    op.create_table(
        "stripe_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.String(length=255), nullable=False, unique=True),
        sa.Column("event_type", sa.String(length=255), nullable=False),
        sa.Column("api_version", sa.String(length=50)),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("processed_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("payload", sa.Text(), nullable=True),
    )
    # Skip all operations on tables that don't exist
'''
    
    # Replace the upgrade function using regex
    modified_content = re.sub(
        r'def upgrade\(\):\s+.*?(?=def downgrade|\Z)',
        new_upgrade_func,
        content,
        flags=re.DOTALL
    )
    
    # Also simplify the downgrade function
    new_downgrade_func = '''
def downgrade():
    op.drop_table("stripe_events")
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
    
    print("Successfully simplified money_and_stripe_events migration")

if __name__ == "__main__":
    simplify_migration()
