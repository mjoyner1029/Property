"""
Database connection test script
"""
import os
import sys
import sqlite3
from pathlib import Path

def main():
    # Path to the database file
    db_path = Path(__file__).parent / "instance" / "dev.db"
    print(f"Database path: {db_path}")
    print(f"Database exists: {db_path.exists()}")
    
    # Ensure parent directory exists
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Execute a simple test query
        cursor.execute("SELECT sqlite_version()")
        version = cursor.fetchone()
        print(f"SQLite version: {version[0]}")
        
        # List all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables in database ({len(tables)}):")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Close connection
        conn.close()
        print("Database connection test successful!")
        return 0
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
