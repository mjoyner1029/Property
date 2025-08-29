"""
Testing utility to debug auth tests directly using Flask test client.
"""
import sys
from pathlib import Path

# Ensure project root is importable
parent_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(parent_dir))

import json
from src import create_app
from src.extensions import db
from src.models.user import User
from werkzeug.security import generate_password_hash

# Create and configure a test app
app = create_app()
app.config.from_object("src.config.TestingConfig")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
app.config["TESTING"] = True
app.config["RATELIMIT_ENABLED"] = False

with app.app_context():
    # Set up the database
    db.create_all()
    
    # Create a test user
    if not User.query.filter_by(email="admin@example.com").first():
        admin = User(
            email="admin@example.com", 
            name="Admin User", 
            role="admin",
            is_verified=True
        )
        admin.set_password("Password123!")
        db.session.add(admin)
        db.session.commit()

    # Get a test client
    client = app.test_client()
    
    # Try the login
    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@example.com",
            "password": "Password123!"
        }
    )
    
    # Print results
    print(f"Status: {response.status_code}")
    print(f"Data: {response.data.decode('utf-8')}")
    
    # Check user verification status
    user = User.query.filter_by(email="admin@example.com").first()
    print(f"User exists: {user is not None}")
    if user:
        print(f"User verification status: {user.is_verified}")
        print(f"User is_active: {user.is_active}")
        print(f"Password check: {user.check_password('Password123!')}")
