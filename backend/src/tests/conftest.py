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
    # Ensure limiter doesn’t interfere with tests
    app.config["RATELIMIT_ENABLED"] = False

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
        admin = User(email="admin@example.com", name="Admin User", role="admin")
        _set_user_password(admin, "Password123!")
        _db.session.add(admin)

    if not User.query.filter_by(email="landlord@example.com").first():
        landlord = User(email="landlord@example.com", name="Landlord User", role="landlord")
        _set_user_password(landlord, "Password123!")
        _db.session.add(landlord)

    if not User.query.filter_by(email="tenant@example.com").first():
        tenant = User(email="tenant@example.com", name="Tenant User", role="tenant")
        _set_user_password(tenant, "Password123!")
        _db.session.add(tenant)

    _db.session.commit()


# ----------------------------
# Seeded users fixture
# ----------------------------
@pytest.fixture(scope="session")
def test_users(app: Flask):
    """Provide seeded admin, landlord, and tenant users."""
    with app.app_context():
        create_test_users()
        users = User.query.filter(
            User.email.in_(
                ["admin@example.com", "landlord@example.com", "tenant@example.com"]
            )
        ).all()
        yield users
        # DB teardown handled by session fixture


# ----------------------------
# Auth token fixtures
# ----------------------------
@pytest.fixture
def admin_token(client, test_users):
    resp = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "Password123!"},
    )
    assert resp.status_code == 200, f"Admin login failed: {resp.status_code} {resp.get_data(as_text=True)}"
    return resp.json["access_token"]


@pytest.fixture
def landlord_token(client, test_users):
    resp = client.post(
        "/api/auth/login",
        json={"email": "landlord@example.com", "password": "Password123!"},
    )
    assert resp.status_code == 200, f"Landlord login failed: {resp.status_code} {resp.get_data(as_text=True)}"
    return resp.json["access_token"]


@pytest.fixture
def tenant_token(client, test_users):
    resp = client.post(
        "/api/auth/login",
        json={"email": "tenant@example.com", "password": "Password123!"},
    )
    assert resp.status_code == 200, f"Tenant login failed: {resp.status_code} {resp.get_data(as_text=True)}"
    return resp.json["access_token"]


# ----------------------------
# Convenience headers
# ----------------------------
@pytest.fixture
def auth_headers(admin_token):
    """Provide Authorization header for admin-authenticated requests."""
    return {"Authorization": f"Bearer {admin_token}"}
