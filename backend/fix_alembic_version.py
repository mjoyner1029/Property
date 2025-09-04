#!/usr/bin/env python3
"""
Fix alembic_version table to only contain the latest migration version.
"""
import os
import sqlite3

def fix_alembic_version():
    # Latest migration version
    latest_version = "20250831_notification_updates"
    
    # Database path
    db_path = "instance/dev.db"
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Delete all existing version records
        cursor.execute("DELETE FROM alembic_version")
        
        # Insert the latest version
        cursor.execute("INSERT INTO alembic_version (version_num) VALUES (?)", (latest_version,))
        
        # Commit the changes
        conn.commit()
        
        print(f"Successfully updated alembic_version to {latest_version}")
    except Exception as e:
        conn.rollback()
        print(f"Error updating alembic_version: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_alembic_version()
