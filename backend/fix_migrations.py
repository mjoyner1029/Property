#!/usr/bin/env python3
"""
Fix migrations with multiple heads by creating a proper chain.
This script updates the down_revision in migrations to create a single chain.
"""
import os
import re

def fix_migrations():
    # Define the migration chain in order (from oldest to newest)
    migration_chain = [
        "682dc312c919",  # initial_schema
        "8a6b5a055408",  # update_schema
        "9a7c4d21e508",  # add_maintenance_type
        "42fd63a85b12",  # add_indexes_for_hot_paths
        "20250820_noop",  # noop migration
        "7d4e5f6g7h8i",  # verify_migrations_process
        "20250819_1430_noop",  # another noop
        "20250825_money_and_stripe_events",
        "abc123456789",  # create_stripe_event_table
        "20250830_missing_fields",
        "20250831_add_field_aliases",
        "a1b2c3d4e5f6",  # add_alias_square_feet
        "20250831_notification_updates"
    ]
    
    # Directory containing migration files
    migration_dir = "migrations/versions"
    
    # Update each migration file to point to the previous one
    for i in range(1, len(migration_chain)):
        current_revision = migration_chain[i]
        previous_revision = migration_chain[i-1]
        
        # Find the migration file for the current revision
        migration_files = os.listdir(migration_dir)
        migration_file = None
        for f in migration_files:
            if current_revision in f and f.endswith('.py'):
                migration_file = os.path.join(migration_dir, f)
                break
        
        if migration_file:
            print(f"Updating {migration_file}")
            
            # Read the file content
            with open(migration_file, 'r') as f:
                content = f.read()
            
            # Replace the down_revision
            updated_content = re.sub(
                r"down_revision\s*=\s*None|down_revision\s*=\s*['\"].*['\"]",
                f"down_revision = '{previous_revision}'",
                content
            )
            
            # Write the updated content back
            with open(migration_file, 'w') as f:
                f.write(updated_content)
            
            print(f"  Set down_revision to '{previous_revision}'")
        else:
            print(f"Warning: Could not find migration file for revision {current_revision}")
    
    print("Migration chain fix complete.")

if __name__ == "__main__":
    fix_migrations()
