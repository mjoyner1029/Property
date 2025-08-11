#!/usr/bin/env python3
"""
Creates a default admin user for testing Asset Anchor.
This script should be run after the database has been initialized.

Usage:
    python create_admin_user.py
"""

import os
import sys
from datetime import datetime
from werkzeug.security import generate_password_hash

# Add backend directory to path so we can import modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

# Import app and extensions
from backend.src.extensions import db
from backend.src.models.user import User
from backend.src.app import create_app

def create_admin_user():
    """Create a default admin user if it doesn't exist already"""
    print("Creating admin user...")
    
    # Create app with development configuration
    app = create_app('development')
    
    # Use app context
    with app.app_context():
        # Check if admin user already exists
        admin_email = "admin@assetanchor.io"
        existing_admin = User.query.filter_by(email=admin_email).first()
        
        if existing_admin:
            print(f"Admin user with email {admin_email} already exists!")
            return
        
        # Create new admin user
        admin_user = User(
            name="Asset Anchor Admin",
            email=admin_email,
            role="admin",
            is_verified=True,
            email_verified_at=datetime.now()
        )
        
        # Set password
        admin_user.set_password("Admin123!")
        
        # Add to database
        db.session.add(admin_user)
        db.session.commit()
        
        print(f"Admin user created successfully with email: {admin_email}")
        print("Password: Admin123!")

if __name__ == "__main__":
    create_admin_user()
