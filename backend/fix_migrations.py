"""
Fix database migration state by marking current revisions as complete
"""
import os
import sys
from pathlib import Path

# Add the parent directory to the path so we can import from src
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(backend_dir.parent))

# Set Flask app environment variable
os.environ['FLASK_APP'] = 'wsgi.py'

# Use existing environment or default to development
os.environ.setdefault('APP_ENV', 'development')

# Import required modules
from flask_migrate import stamp

# Import the app
from src import create_app

app = create_app()

print("Stamping database with 'heads' to mark all migrations as applied...")
with app.app_context():
    # Mark all migrations as complete
    stamp(revision='heads')
print("Database stamped successfully!")

# Now let's verify the database tables
from src.extensions import db

with app.app_context():
    # Get all table names from the database
    inspector = db.inspect(db.engine)
    tables = inspector.get_table_names()
    print("\nDatabase tables:")
    for table in tables:
        print(f"- {table}")
    
    # Verify if critical tables exist - note that some tables might be plural
    critical_tables_map = {
        'user': ['user', 'users'],
        'property': ['property', 'properties'],
        'payment': ['payment', 'payments'],
        'stripe_event': ['stripe_event', 'stripe_events']
    }
    
    missing_tables = []
    for critical, variations in critical_tables_map.items():
        if not any(variation in tables for variation in variations):
            missing_tables.append(critical)
    
    if missing_tables:
        print("\nWARNING: Some critical tables are missing:")
        for table in missing_tables:
            print(f"- {table}")
        print("\nConsider running migrations with --sql option to see what changes are needed.")
    else:
        print("\nAll critical tables exist in the database.")

print("\nDatabase migration state fixed!")
