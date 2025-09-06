#!/usr/bin/env python3
"""
Simple script to create the database schema and seed users.
This uses db.create_all() directly without Alembic migrations.
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up the path
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, THIS_DIR)

from src.app import create_app
from src.extensions import db
from src.models.user import User


def create_database_and_users():
    """Create database schema and test users."""
    app = create_app()
    
    with app.app_context():
        print("Creating database schema...")
        
        # Create all tables
        db.create_all()
        print("Database schema created successfully!")
        
        # Check if users already exist
        admin_user = User.query.filter_by(email="admin@example.com").first()
        landlord_user = User.query.filter_by(email="landlord@example.com").first()
        tenant_user = User.query.filter_by(email="tenant@example.com").first()
        
        users_created = []
        
        # Create admin user if doesn't exist
        if not admin_user:
            admin_user = User(
                email="admin@example.com",
                name="Test Admin",
                role="admin",
                is_verified=True,
                email_verified_at=datetime.utcnow()
            )
            admin_user.set_password("Password123!")
            db.session.add(admin_user)
            users_created.append("admin@example.com")
        else:
            print("Admin user already exists")
        
        # Create landlord user if doesn't exist
        if not landlord_user:
            landlord_user = User(
                email="landlord@example.com",
                name="Test Landlord",
                role="landlord",
                is_verified=True,
                email_verified_at=datetime.utcnow()
            )
            landlord_user.set_password("Password123!")
            db.session.add(landlord_user)
            users_created.append("landlord@example.com")
        else:
            print("Landlord user already exists")
        
        # Create tenant user if doesn't exist
        if not tenant_user:
            tenant_user = User(
                email="tenant@example.com",
                name="Test Tenant",
                role="tenant",
                is_verified=True,
                email_verified_at=datetime.utcnow()
            )
            tenant_user.set_password("Password123!")
            db.session.add(tenant_user)
            users_created.append("tenant@example.com")
        else:
            print("Tenant user already exists")
        
        # Commit the changes
        if users_created:
            db.session.commit()
            print(f"Successfully created users: {', '.join(users_created)}")
        else:
            print("All test users already exist")
        
        print("\n" + "="*50)
        print("🎉 Database setup completed successfully!")
        print("="*50)
        print("\nTest login credentials:")
        print("👤 Admin: admin@example.com / Password123!")
        print("🏠 Landlord: landlord@example.com / Password123!")
        print("🏘️ Tenant: tenant@example.com / Password123!")
        print("\nYou can now start the frontend and test login with these credentials.")


if __name__ == "__main__":
    create_database_and_users()
