# backend/src/tests/conftest.py
"""
Pytest configuration for testing Asset Anchor backend.
Sets up app, database, seeded users, and auth token fixtures.
"""
import sys
from pathlib import Path

# Ensure project root is importable
parent_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(parent_dir))

import pytest
from flask import Flask

from src import create_app
from src.extensions import db as _db
from src.models.user import User
from src.models.property import Property
from src.models.unit import Unit
from src.models.tenant_property import TenantProperty
from src.models.maintenance_request import MaintenanceRequest
from src.models.payment import Payment


# ----------------------------
# App + DB Fixtures
# ----------------------------
@pytest.fixture(scope="session")
def app() -> Flask:
    """Create and configure a Flask app for testing with in-memory SQLite."""
    app = create_app()
    app.config.from_object("src.config.TestingConfig")

    # Override DB for isolated tests
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["TESTING"] = True
    
    # Set environment variables for test mode
    import os
    os.environ["FLASK_ENV"] = "testing"
    os.environ["TESTING"] = "True"
    os.environ["FLASK_LIMITER_ENABLED"] = "False"
    
    # Comprehensively disable rate limiting for tests
    app.config["RATELIMIT_ENABLED"] = False
    app.config["LIMITER_ENABLED"] = False
    app.config["FLASK_LIMITER_ENABLED"] = False
    
    # Completely disable rate limiting for tests
    app.config["RATELIMIT_ENABLED"] = False
    app.config["LIMITER_ENABLED"] = False
    app.config["FLASK_LIMITER_ENABLED"] = False
    app.config["RATELIMIT_STORAGE_URI"] = "memory://"
    app.config["RATELIMIT_STORAGE_URL"] = "memory://"
    app.config["RATELIMIT_IN_MEMORY_FALLBACK_ENABLED"] = True
    app.config["RATELIMIT_DEFAULT"] = "1000000 per second"
    app.config["RATELIMIT_APPLICATION"] = "1000000 per second"
    app.config["RATELIMIT_HEADERS_ENABLED"] = False
    
    # Disable account lockout for tests
    app.config["ACCOUNT_LOCKOUT_MAX_ATTEMPTS"] = 1000
    app.config["ACCOUNT_LOCKOUT_DURATION_MINUTES"] = 1
    
    # Configure JWT for deterministic tests - extremely long expiry to prevent any expiration during tests
    app.config["JWT_TOKEN_LOCATION"] = ["headers"]
    app.config["JWT_COOKIE_SECURE"] = False
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 7 * 24 * 3600  # 7 days for tests
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 30 * 24 * 3600  # 30 days for tests

    with app.app_context():
        _db.create_all()

    yield app

    with app.app_context():
        _db.drop_all()


@pytest.fixture
def client(app: Flask):
    """Flask test client."""
    return app.test_client()


@pytest.fixture(scope="session")
def db(app: Flask):
    """Expose SQLAlchemy db handle for tests."""
    return _db


# ----------------------------
# Helper: Create test users
# ----------------------------
def _set_user_password(user: User, plaintext: str) -> None:
    """Best-effort way to set user password across possible model implementations."""
    from werkzeug.security import generate_password_hash

    if hasattr(user, "set_password") and callable(user.set_password):
        user.set_password(plaintext)
        return
    if hasattr(type(user), "password") and isinstance(getattr(type(user), "password"), property):
        try:
            user.password = plaintext  # type: ignore[attr-defined]
            return
        except Exception:
            pass
    if hasattr(user, "password_hash"):
        user.password_hash = generate_password_hash(plaintext)
        return
    # Last resort — fallback (only in test env!)
    setattr(user, "password", plaintext)


def create_test_users() -> None:
    """Seed admin, landlord, and tenant test users if not present."""
    if not User.query.filter_by(email="admin@example.com").first():
        admin = User(email="admin@example.com", name="Admin User", role="admin", 
                    is_verified=True)  # Ensure is_verified is set to True
        _set_user_password(admin, "Password123!")
        _db.session.add(admin)

    if not User.query.filter_by(email="landlord@example.com").first():
        landlord = User(email="landlord@example.com", name="Landlord User", role="landlord",
                       is_verified=True)  # Ensure is_verified is set to True
        _set_user_password(landlord, "Password123!")
        _db.session.add(landlord)

    if not User.query.filter_by(email="tenant@example.com").first():
        tenant = User(email="tenant@example.com", name="Tenant User", role="tenant",
                     is_verified=True)  # Ensure is_verified is set to True
        _set_user_password(tenant, "Password123!")
        _db.session.add(tenant)

    _db.session.commit()


# ----------------------------
# Seeded users fixture
# ----------------------------
@pytest.fixture
def test_users(app, db):
    """Create test users for auth tests."""
    with app.app_context():
        # Clear any account locks
        users = User.query.all()
        for user in users:
            user.locked_until = None
            user.failed_login_attempts = 0
            
        # Clear the failed attempts cache
        from src.utils.account_security import failed_attempts
        failed_attempts.clear()
        
        create_test_users()
        db.session.commit()
        
        # Return a dictionary of users by role for easier access
        users = User.query.filter(
            User.email.in_(["admin@example.com", "landlord@example.com", "tenant@example.com"])
        ).all()
        
        # Convert list to dictionary keyed by role
        return {user.role: user for user in users}


# ----------------------------
# Auth token fixtures
# ----------------------------
@pytest.fixture
def admin_token(app, test_users):
    # Create tokens directly with JWT instead of hitting login endpoints
    with app.app_context():
        from flask_jwt_extended import create_access_token
        admin = test_users['admin']
        # Set explicit expiration to ensure we have plenty of time for the test
        import datetime
        expiry = datetime.timedelta(hours=24)  # 24 hour expiry for test tokens - long enough for any test run
        # Use string ID consistently to match how tokens are created in production routes
        token = create_access_token(identity=str(admin.id), expires_delta=expiry)
        print(f"DEBUG - Created admin token with ID: {admin.id}, type: {type(str(admin.id))}")
        return token


@pytest.fixture
def landlord_token(app, test_users):
    # Create tokens directly with JWT instead of hitting login endpoints
    with app.app_context():
        from flask_jwt_extended import create_access_token
        landlord = test_users['landlord']
        # Set explicit expiration to ensure we have plenty of time for the test
        import datetime
        expiry = datetime.timedelta(hours=24)  # 24 hour expiry for test tokens - long enough for any test run
        # Use string ID consistently to match how tokens are created in production routes
        token = create_access_token(identity=str(landlord.id), expires_delta=expiry)
        print(f"DEBUG - Created landlord token with ID: {landlord.id}, type: {type(str(landlord.id))}")
        return token


@pytest.fixture
def tenant_token(app, test_users):
    # Create tokens directly with JWT instead of hitting login endpoints
    with app.app_context():
        from flask_jwt_extended import create_access_token
        tenant = test_users['tenant']
        # Set explicit expiration to ensure we have plenty of time for the test
        import datetime
        expiry = datetime.timedelta(hours=24)  # 24 hour expiry for test tokens - long enough for any test run
        # Use string ID consistently to match how tokens are created in production routes
        token = create_access_token(identity=str(tenant.id), expires_delta=expiry)
        print(f"DEBUG - Created tenant token with ID: {tenant.id}, type: {type(str(tenant.id))}")
        return token


@pytest.fixture
def auth_headers(client, test_users, admin_token, landlord_token, tenant_token):
    """Return headers with authentication for different roles."""
    headers = {
        "admin": {"Authorization": f"Bearer {admin_token}"},
        "landlord": {"Authorization": f"Bearer {landlord_token}"},
        "tenant": {"Authorization": f"Bearer {tenant_token}"}
    }
    
    # Print debug information about tokens
    print(f"DEBUG - admin_token: {admin_token[:20]}...")
    print(f"DEBUG - landlord_token: {landlord_token[:20]}...")
    print(f"DEBUG - tenant_token: {tenant_token[:20]}...")
    print(f"DEBUG - admin_headers: {headers['admin']}")
    print(f"DEBUG - landlord_headers: {headers['landlord']}")
    print(f"DEBUG - tenant_headers: {headers['tenant']}")
    
    return headers


@pytest.fixture
def landlord_auth_headers(client, test_users, landlord_token):
    """Return headers with landlord authentication."""
    return {"Authorization": f"Bearer {landlord_token}"}


@pytest.fixture
def tenant_auth_headers(client, test_users, tenant_token):
    """Return headers with tenant authentication."""
    return {"Authorization": f"Bearer {tenant_token}"}


@pytest.fixture
def session(app):
    """
    Provide a database session fixture for tests that directly use SQLAlchemy
    instead of going through the Flask-SQLAlchemy db instance.
    """
    with app.app_context():
        from sqlalchemy.orm import scoped_session, sessionmaker
        
        # Create a new session
        engine = _db.engine
        Session = scoped_session(sessionmaker(bind=engine))
        session = Session()
        
        yield session
        
        # Clean up
        session.close()
        
@pytest.fixture
def test_property(app, db, session, test_users):
    """Create a test property for testing.
    Returns a dictionary with 'property_id', 'property_name' and 'unit_ids' keys."""
    with app.app_context():
        # Get the landlord user
        landlord = User.query.filter_by(email="landlord@example.com").first()
        
        # Always create a fresh property for tests to avoid DetachedInstanceError
        import uuid
        unique_name = f"Test Property {uuid.uuid4()}"
        
        # Create a test property
        test_property = Property(
            name=unique_name,
            address="123 Test St",
            city="Testville",
            state="TS",
            zip_code="12345",
            landlord_id=landlord.id,
            status="active",
            bedrooms=3,  # Add default values for these fields
            bathrooms=2,
            square_feet=1500,
            year_built=2020,
            property_type="residential",
            description="Test property description"
        )
        
        db.session.add(test_property)
        db.session.commit()  # Commit to ensure property is persisted and has an ID
        property_id = test_property.id
        property_name = test_property.name
        
        # Create multiple test units for this property
        unit_ids = []
        for i in range(3):
            test_unit = Unit(
                property_id=property_id,
                unit_number=f"{101+i}",
                bedrooms=2,
                bathrooms=1,
                size=1000,  # Use size, not square_feet
                status="available"
            )
            db.session.add(test_unit)
            db.session.flush()  # Flush to generate IDs without committing
            unit_ids.append(test_unit.id)
        
        db.session.commit()  # Commit to ensure units are persisted
        
        # Return a dictionary with property and unit IDs only
        # This avoids DetachedInstanceError by not storing the actual ORM objects
        result = {
            'property_id': property_id,
            'property_name': property_name,
            'unit_ids': unit_ids,
            'property': test_property  # Add the property object for tests that need it
        }
        return result
