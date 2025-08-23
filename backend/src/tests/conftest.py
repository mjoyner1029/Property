"""
Pytest configuration for testing.
"""
import sys
from pathlib import Path

# Add the project root to sys.path so "src" is importable
parent_dir = Path(__file__).parent.parent.parent
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


@pytest.fixture(scope="session")
def app():
    """Create and configure a Flask app for testing."""
    app = create_app()
    app.config.from_object("config.TestingConfig")

    # Use in-memory SQLite for tests
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["TESTING"] = True
    # Disable rate limiting in tests (in case TestingConfig doesn't)
    app.config.setdefault("RATELIMIT_ENABLED", False)

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
    """Session-wide test database handle."""
    return _db


def create_test_users():
    """Create test users for different roles."""
    from werkzeug.security import generate_password_hash

    def _set_user_password(user, plaintext: str):
        # Preferred: model exposes a helper
        if hasattr(user, "set_password") and callable(user.set_password):
            user.set_password(plaintext)
            return
        # Common: property setter 'password' hashes internally
        maybe_prop = getattr(type(user), "password", None)
        if isinstance(maybe_prop, property):
            try:
                setattr(user, "password", plaintext)
                return
            except Exception:
                pass
        # Fallback: direct hash into password_hash if present
        if hasattr(user, "password_hash"):
            try:
                user.password_hash = generate_password_hash(plaintext)
                return
            except Exception:
                pass
        # Last resort: store plaintext (not recommended, but keeps tests unblocked)
        try:
            setattr(user, "password", plaintext)
        except Exception as e:
            raise RuntimeError(f"Could not set a password on User model: {e}")

    # Admin user
    if not User.query.filter_by(email="admin@example.com").first():
        admin = User(
            email="admin@example.com",
            name="Admin User",
            role="admin",
        )
        _set_user_password(admin, "Password123!")
        _db.session.add(admin)

    # Landlord user
    if not User.query.filter_by(email="landlord@example.com").first():
        landlord = User(
            email="landlord@example.com",
            name="Landlord User",
            role="landlord",
        )
        _set_user_password(landlord, "Password123!")
        _db.session.add(landlord)

    # Tenant user
    if not User.query.filter_by(email="tenant@example.com").first():
        tenant = User(
            email="tenant@example.com",
            name="Tenant User",
            role="tenant",
        )
        _set_user_password(tenant, "Password123!")
        _db.session.add(tenant)

    _db.session.commit()


# ---- Seeded users fixture (session scope) ----
@pytest.fixture(scope="session")
def test_users(app):
    """Seed a few users for tests that expect them."""
    with app.app_context():
        create_test_users()
        users = User.query.filter(
            User.email.in_(["admin@example.com", "landlord@example.com", "tenant@example.com"])
        ).all()
        yield users
        # DB is dropped at session end; no per-user cleanup required.


# ---- Auth token fixtures (depend on seeded users) ----
@pytest.fixture
def admin_token(client, test_users):
    """Get an admin JWT token."""
    resp = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "Password123!"},
    )
    assert resp.status_code == 200, f"Admin login failed: {resp.status_code} {resp.get_data(as_text=True)}"
    return resp.json["access_token"]


@pytest.fixture
def landlord_token(client, test_users):
    """Get a landlord JWT token."""
    resp = client.post(
        "/api/auth/login",
        json={"email": "landlord@example.com", "password": "Password123!"},
    )
    assert resp.status_code == 200, f"Landlord login failed: {resp.status_code} {resp.get_data(as_text=True)}"
    return resp.json["access_token"]


@pytest.fixture
def tenant_token(client, test_users):
    """Get a tenant JWT token."""
    resp = client.post(
        "/api/auth/login",
        json={"email": "tenant@example.com", "password": "Password123!"},
    )
    assert resp.status_code == 200, f"Tenant login failed: {resp.status_code} {resp.get_data(as_text=True)}"
    return resp.json["access_token"]


# Convenience headers used by tests like test_admin_get_users
@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
