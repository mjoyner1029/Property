"""
Merge all head revisions of the database migrations
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
from flask_migrate import upgrade

# Import the app
from src import create_app

app = create_app()

print("Running all migration heads...")
with app.app_context():
    upgrade(revision='heads')
print("All migrations applied!")
