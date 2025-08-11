"""
Initialize the database with tables and seed data.
Run this script once when setting up a new database.
"""
import os
import sys
from datetime import datetime
from werkzeug.security import generate_password_hash

# Add the parent directory to path so we can import from src
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.extensions import db
from src.app import create_app
from src.models.user import User

def create_admin_user(email, password, name):
    """Create an admin user in the database."""
    admin = User.query.filter_by(email=email).first()
    
    if admin is None:
        print(f"Creating admin user: {email}")
        admin = User(
            email=email,
            name=name,
            role="admin",
            is_verified=True,
            email_verified_at=datetime.utcnow()
        )
        admin.set_password(password)
        db.session.add(admin)
        db.session.commit()
        print("Admin user created successfully!")
    else:
        print(f"Admin user {email} already exists!")

def initialize_database():
    """Create database tables and add initial data."""
    print("Creating database tables...")
    db.create_all()
    
    # Create admin user if provided in environment variables
    admin_email = os.environ.get('ADMIN_EMAIL')
    admin_password = os.environ.get('ADMIN_PASSWORD')
    admin_name = os.environ.get('ADMIN_NAME', 'System Administrator')
    
    if admin_email and admin_password:
        create_admin_user(admin_email, admin_password, admin_name)
    else:
        print("No admin credentials provided. Skipping admin user creation.")
        print("You can create an admin user later using the 'create_admin_user.py' script.")
    
    print("Database initialization complete!")

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        initialize_database()
