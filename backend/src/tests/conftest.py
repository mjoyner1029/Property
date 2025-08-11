"""
Pytest configuration for testing.
"""
import sys
import os
from pathlib import Path

# Add the parent directory to sys.path
parent_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(parent_dir))

import pytest
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

from src import create_app
from src.extensions import db as _db
from src.models.user import User
from src.models.property import Property
from src.models.unit import Unit
from src.models.tenant_property import TenantProperty
from src.models.maintenance_request import MaintenanceRequest
from src.models.payment import Payment

@pytest.fixture(scope="session")
def app():
    """Create and configure a Flask app for testing."""
    app = create_app()
    app.config.from_object("config.TestingConfig")
    
    # Create the database and tables for testing
    with app.app_context():
        _db.create_all()
        
    yield app
    
    # Clean up after tests
    with app.app_context():
        _db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture(scope="session")
def db(app):
    """Session-wide test database."""
    return _db

@pytest.fixture
def admin_token(client):
    """Get an admin JWT token."""
    response = client.post(
        '/api/auth/login',
        json={
            'email': 'admin@example.com',
            'password': 'Password123!'
        }
    )
    return response.json['access_token']

@pytest.fixture
def landlord_token(client):
    """Get a landlord JWT token."""
    response = client.post(
        '/api/auth/login',
        json={
            'email': 'landlord@example.com',
            'password': 'Password123!'
        }
    )
    return response.json['access_token']

@pytest.fixture
def tenant_token(client):
    """Get a tenant JWT token."""
    response = client.post(
        '/api/auth/login',
        json={
            'email': 'tenant@example.com',
            'password': 'Password123!'
        }
    )
    return response.json['access_token']

def create_test_users():
    """Create test users for different roles."""
    from werkzeug.security import generate_password_hash
    
    # Admin user
    if not User.query.filter_by(email='admin@example.com').first():
        admin = User(
            email='admin@example.com',
            password_hash=generate_password_hash('Password123!'),
            name='Admin User',
            role='admin'
        )
        _db.session.add(admin)
    
    # Landlord user
    if not User.query.filter_by(email='landlord@example.com').first():
        landlord = User(
            email='landlord@example.com',
            password_hash=generate_password_hash('Password123!'),
            name='Landlord User',
            role='landlord'
        )
        _db.session.add(landlord)
    
    # Tenant user
    if not User.query.filter_by(email='tenant@example.com').first():
        tenant = User(
            email='tenant@example.com',
            password_hash=generate_password_hash('Password123!'),
            name='Tenant User',
            role='tenant'
        )
        _db.session.add(tenant)
    
    _db.session.commit()
