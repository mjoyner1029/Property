import pytest
from datetime import datetime, timedelta
import secrets
from ..models.user import User


def test_request_password_reset(client, test_users, app):
    """Test requesting a password reset."""
    resp = client.post("/api/auth/password/reset-request", json={
        "email": "tenant@example.com",
    })
    
    assert resp.status_code == 200
    assert "message" in resp.get_json()
    # We should get a generic success message even if email doesn't exist
    assert "If your email is registered" in resp.get_json()["message"]
    
    # Check that reset token was created in the database
    with app.app_context():
        user = User.query.filter_by(email="tenant@example.com").first()
        assert user.reset_token is not None
        assert user.reset_token_expiry > datetime.utcnow()


def test_request_password_reset_invalid_email(client):
    """Test requesting a password reset with invalid email."""
    resp = client.post("/api/auth/password/reset-request", json={
        "email": "notanemail",
    })
    
    assert resp.status_code == 200
    # Should still get generic success message for security
    assert "If your email is registered" in resp.get_json()["message"]


def test_confirm_password_reset_success(client, test_users, app, db):
    """Test successfully resetting a password."""
    # Set up a user with a reset token
    with app.app_context():
        user = User.query.filter_by(email="tenant@example.com").first()
        reset_token = secrets.token_urlsafe(24)
        user.reset_token = reset_token
        user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
        db.session.commit()
    
    # Test the reset endpoint
    resp = client.post("/api/auth/password/reset-confirm", json={
        "token": reset_token,
        "new_password": "NewSecurePassword123!",
    })
    
    assert resp.status_code == 200
    assert "message" in resp.get_json()
    assert "successfully" in resp.get_json()["message"]
    
    # Verify token was cleared
    with app.app_context():
        user = User.query.filter_by(email="tenant@example.com").first()
        assert user.reset_token is None
        assert user.reset_token_expiry is None
    
    # Verify we can login with the new password
    resp = client.post("/api/auth/login", json={
        "email": "tenant@example.com",
        "password": "NewSecurePassword123!",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.get_json()


def test_confirm_password_reset_invalid_token(client):
    """Test resetting password with invalid token."""
    resp = client.post("/api/auth/password/reset-confirm", json={
        "token": "invalid-token",
        "new_password": "NewSecurePassword123!",
    })
    
    assert resp.status_code == 404
    assert "error" in resp.get_json()
    assert "Invalid or expired reset token" in resp.get_json()["error"]


def test_confirm_password_reset_expired_token(client, test_users, app, db):
    """Test resetting password with expired token."""
    # Set up a user with an expired reset token
    with app.app_context():
        user = User.query.filter_by(email="tenant@example.com").first()
        reset_token = secrets.token_urlsafe(24)
        user.reset_token = reset_token
        user.reset_token_expiry = datetime.utcnow() - timedelta(hours=1)  # Expired
        db.session.commit()
    
    resp = client.post("/api/auth/password/reset-confirm", json={
        "token": reset_token,
        "new_password": "NewSecurePassword123!",
    })
    
    assert resp.status_code == 400
    assert "error" in resp.get_json()
    assert "expired" in resp.get_json()["error"]


def test_confirm_password_reset_weak_password(client, test_users, app, db):
    """Test resetting password with a weak password."""
    # Set up a user with a reset token
    with app.app_context():
        user = User.query.filter_by(email="tenant@example.com").first()
        reset_token = secrets.token_urlsafe(24)
        user.reset_token = reset_token
        user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
        db.session.commit()
    
    resp = client.post("/api/auth/password/reset-confirm", json={
        "token": reset_token,
        "new_password": "weak",
    })
    
    assert resp.status_code == 400
    assert "error" in resp.get_json()
    assert "strength" in resp.get_json()["error"]
