"""
Database Migration Helper - Use this to set up the database for development
"""
import os
import sys
from pathlib import Path

# Add the parent directory to the path so we can import from src
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(backend_dir.parent))

# Set development environment
os.environ['APP_ENV'] = 'development'
os.environ['FLASK_APP'] = 'wsgi.py'

# Import required modules
from src.extensions import db
from src import create_app

# Create the app with the development configuration
app = create_app()

# Ensure the instance directory exists
instance_dir = Path(app.instance_path)
instance_dir.mkdir(exist_ok=True, parents=True)

# Get database URI
db_uri = app.config.get('SQLALCHEMY_DATABASE_URI')
print(f"Using database URI: {db_uri}")

# Check if it's SQLite and extract path
if db_uri and db_uri.startswith('sqlite:///'):
    db_path = db_uri.replace('sqlite:///', '')
    
    # Handle relative paths
    if not db_path.startswith('/'):
        db_dir = Path(os.path.dirname(db_path))
        if not db_dir.is_absolute():
            # Make it absolute relative to instance directory
            absolute_db_path = os.path.join(app.instance_path, db_path)
            print(f"Database path (absolute): {absolute_db_path}")
            
            # Ensure directory exists
            db_dir = Path(os.path.dirname(absolute_db_path))
            db_dir.mkdir(exist_ok=True, parents=True)
            
            # Update config with absolute path
            app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{absolute_db_path}"
            print(f"Updated database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")

# Print the final config for verification
print(f"Final database URI: {app.config.get('SQLALCHEMY_DATABASE_URI')}")

# Create database
with app.app_context():
    print("Creating database tables...")
    db.create_all()
    print("Database tables created!")

# Run migrations
if '--run-migrations' in sys.argv:
    from flask_migrate import upgrade
    print("Running database migrations...")
    with app.app_context():
        upgrade()
    print("Migrations complete!")

print("Database setup complete!")
