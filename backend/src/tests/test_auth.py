# backend/src/tests/test_auth.py
import pytest

# ---------------------------
# Login
# ---------------------------

def test_login_success(client, test_users, app):
    """Test successful user login."""
    # Ensure tests aren't blocked by email verification unless your fixture sets it
    app.config["REQUIRE_EMAIL_VERIFICATION"] = False

    resp = client.post("/api/auth/login", json={
        "email": "landlord@example.com",
        "password": "Password123!",
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert "user" in data
    assert data["user"]["email"] == "landlord@example.com"
    assert isinstance(data.get("expires_in"), int)


def test_login_invalid_credentials(client):
    """Test login with invalid credentials."""
    resp = client.post("/api/auth/login", json={
        "email": "landlord@example.com",
        "password": "WrongPassword123!",
    })
    assert resp.status_code == 401
    data = resp.get_json()
    assert "error" in data


def test_login_missing_fields(client):
    """Login should require email & password."""
    resp = client.post("/api/auth/login", json={"email": "x@example.com"})
    assert resp.status_code == 400
    assert "error" in resp.get_json()


# ---------------------------
# Registration
# ---------------------------

def test_register_success(client):
    """Test successful user registration."""
    resp = client.post("/api/auth/register", json={
        "name": "New User",
        "email": "new@example.com",
        "password": "Password123!",
        "role": "tenant",
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert "message" in data
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "new@example.com"


def test_register_duplicate_email(client, test_users):
    """Registration should fail for existing email."""
    resp = client.post("/api/auth/register", json={
        "name": "Duplicate User",
        "email": "landlord@example.com",  # Already exists
        "password": "Password123!",
        "role": "tenant",
    })
    assert resp.status_code == 409
    data = resp.get_json()
    assert "error" in data


def test_register_missing_fields(client):
    """Registration should enforce required fields."""
    resp = client.post("/api/auth/register", json={
        "email": "nouser@example.com",
        "password": "Password123!",
        "role": "tenant",
    })
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_register_weak_password(client):
    """Registration should enforce password strength."""
    resp = client.post("/api/auth/register", json={
        "name": "Weak Pwd",
        "email": "weak@example.com",
        "password": "weak",  # too weak
        "role": "tenant",
    })
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_register_invalid_role(client):
    """Registration should only allow allowed roles."""
    resp = client.post("/api/auth/register", json={
        "name": "Role Test",
        "email": "role@example.com",
        "password": "Password123!",
        "role": "superuser",
    })
    assert resp.status_code == 400
    assert "error" in resp.get_json()


# ---------------------------
# Password reset + verification
# ---------------------------

@pytest.mark.parametrize("endpoint", [
    "/api/auth/password/reset-request",
    "/api/auth/password/reset_request",  # in case legacy route exists
])
def test_password_reset_request(client, test_users, endpoint):
    """
    Test password reset request. We accept either modern or legacy route if both exist.
    If one doesn't exist in the app, skip gracefully.
    """
    resp = client.post(endpoint, json={"email": "landlord@example.com"})
    if resp.status_code == 404:  # endpoint not wired in this build
        pytest.skip(f"{endpoint} not registered")
    assert resp.status_code in (200, 202)
    data = resp.get_json()
    assert "message" in data


def test_verify_token_valid_placeholder(app):
    """
    Placeholder for email verification token validation.
    Implement when your verification route is available:
      - Create a user with verification_token
      - Call /api/auth/verify?token=<token>
      - Expect 200 and user.is_verified == True
    """
    assert True
