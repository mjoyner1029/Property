"""
Pytest configuration for testing.
"""
import pytest
from src import create_app
from src.extensions import db as _db
from src.models.user import User
import os
import tempfile

@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    # Create a temporary file to isolate the database for each test
    db_fd, db_path = tempfile.mkstemp()
    
    app = create_app()
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'JWT_SECRET_KEY': 'test_secret_key',
        'WTF_CSRF_ENABLED': False,
    })

    # Create the database and the database tables
    with app.app_context():
        _db.create_all()
        
        # Create test users
        create_test_users()
    
    yield app
    
    # Close and remove the temporary database
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def db(app):
    """Database for testing."""
    with app.app_context():
        yield _db

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
