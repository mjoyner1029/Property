import pytest
import json
import time
from flask_jwt_extended import decode_token
from .account_fixtures import clear_account_locks

def test_password_complexity_lowercase(client, app):
    """Test that password must have lowercase letters"""
    # Test password without lowercase
    with app.test_client() as test_client:
        response = test_client.post('/api/auth/register', json={
            'name': 'Test User',
            'email': 'weak2@example.com',
            'password': 'PASSWORD123!',
            'role': 'tenant'
        })
        assert response.status_code == 400
        assert "lowercase letter" in response.get_json().get("error", "")

def test_password_complexity_number(client, app):
    """Test that password must have numbers"""
    # Test password without number
    with app.test_client() as test_client:
        response = test_client.post('/api/auth/register', json={
            'name': 'Test User',
            'email': 'weak3@example.com',
            'password': 'Password!',
            'role': 'tenant'
        })
        assert response.status_code == 400
        assert "digit" in response.get_json().get("error", "")

def test_password_complexity_special(client, app):
    """Test that password must have special characters"""
    # Test password without special character
    with app.test_client() as test_client:
        response = test_client.post('/api/auth/register', json={
            'name': 'Test User',
            'email': 'weak4@example.com',
            'password': 'Password123',
            'role': 'tenant'
        })
        assert response.status_code == 400
        assert "special character" in response.get_json().get("error", "")

def test_password_complexity_length(client, app):
    """Test that password must have minimum length"""
    # Test password too short
    with app.test_client() as test_client:
        response = test_client.post('/api/auth/register', json={
            'name': 'Test User',
            'email': 'weak5@example.com',
            'password': 'Pass1!',
            'role': 'tenant'
        })
        assert response.status_code == 400
        assert "8 characters" in response.get_json().get("error", "")

def test_password_complexity_valid(client, app):
    """Test that valid password works"""
    # Test valid password
    with app.test_client() as test_client:
        response = test_client.post('/api/auth/register', json={
            'name': 'Test User',
            'email': 'valid@example.com',
            'password': 'Password123!',
            'role': 'tenant'
        })
        assert response.status_code == 201

def test_account_lockout(app, test_users, clear_account_locks):
    """Test that accounts are locked after multiple failed login attempts"""
    # Configure lower lockout threshold for this test
    app.config["ACCOUNT_LOCKOUT_MAX_ATTEMPTS"] = 5
    app.config["ACCOUNT_LOCKOUT_DURATION_MINUTES"] = 30
    
    # Make multiple failed login attempts using fresh test clients
    for i in range(5):  # Assuming lockout threshold is 5
        with app.test_client() as client:
            response = client.post('/api/auth/login', json={
                'email': 'landlord@example.com',
                'password': f'WrongPassword{i}!'
            })
            assert response.status_code in [401, 403]  # Either unauthorized or forbidden
    
    # Now even with correct password, the account should be locked
    with app.test_client() as client:
        response = client.post('/api/auth/login', json={
            'email': 'landlord@example.com',
            'password': 'Password123!'  # Correct password
        })
        assert response.status_code == 403
        data = json.loads(response.data)
        assert 'error' in data
        assert 'locked' in data['error'].lower() or 'attempts' in data['error'].lower()


def test_jwt_expiration(app, test_users):
    """Test that JWT tokens have proper expiration times"""
    # Clear all account locks before testing
    with app.test_client() as client:
        response = client.post('/api/auth/login', json={
            'email': 'landlord@example.com',
            'password': 'Password123!'
        })
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'access_token' in data

        # Decode the token and check expiration
        from flask import current_app
        token = data['access_token']
        decoded = decode_token(token)

        # Check that token has an expiration claim
        assert 'exp' in decoded

        # Check that expiration matches configuration (7 days in dev mode)
        # The expiration should be approximately 7 days from the issued time
        expected_expiry = 60 * 60 * 24 * 7  # 7 days in seconds
        # Allow a small margin of error (10 seconds)
        assert abs((decoded['exp'] - decoded['iat']) - expected_expiry) < 10
def test_session_timeout(app, test_users):
    """Test that sessions timeout after inactivity"""
    # This is harder to test directly in pytest, but we can check the token expiration
    # which is a proxy for session timeout in JWT-based auth
    with app.test_client() as client:
        response = client.post('/api/auth/login', json={
            'email': 'landlord@example.com',
            'password': 'Password123!'
        })
        assert response.status_code == 200
        data = json.loads(response.data)

        # Make sure the token has a reasonable expiration
        token = data['access_token']
        decoded = decode_token(token)

        # Session timeout in development mode is 7 days
        expected_expiry = 60 * 60 * 24 * 7  # 7 days in seconds
        token_lifetime = decoded['exp'] - decoded['iat']
        # Allow a small margin of error (10 seconds)
        assert token_lifetime > 0 and abs(token_lifetime - expected_expiry) < 10
def test_input_validation_login_missing_email(app, monkeypatch):
    """Test input validation for login endpoint - missing email"""
    # Disable rate limiter for this test
    monkeypatch.setattr('src.routes.auth_routes.limiter.enabled', False)
    with app.test_client() as client:
        response = client.post('/api/auth/login', json={
            'password': 'Password123!'
        })
        assert response.status_code == 400
        assert 'email' in response.get_json().get('error', '').lower()
        
def test_input_validation_login_invalid_email(app, monkeypatch):
    """Test input validation for login endpoint - invalid email"""
    # Disable rate limiter for this test
    monkeypatch.setattr('src.routes.auth_routes.limiter.enabled', False)
    with app.test_client() as client:
        response = client.post('/api/auth/login', json={
            'email': 'not-an-email',
            'password': 'Password123!'
        })
        # The API returns 401 for invalid login credentials, which is correct
        # for security reasons (don't reveal which part is wrong)
        assert response.status_code == 401
        
def test_input_validation_login_missing_password(app, monkeypatch):
    """Test input validation for login endpoint - missing password"""
    # Disable rate limiter for this test
    monkeypatch.setattr('src.routes.auth_routes.limiter.enabled', False)
    with app.test_client() as client:
        response = client.post('/api/auth/login', json={
            'email': 'test@example.com'
        })
        assert response.status_code == 400
        assert 'password' in response.get_json().get('error', '').lower()
        
def test_input_validation_login_empty_payload(app, monkeypatch):
    """Test input validation for login endpoint - empty payload"""
    # Disable rate limiter for this test
    monkeypatch.setattr('src.routes.auth_routes.limiter.enabled', False)
    with app.test_client() as client:
        response = client.post('/api/auth/login', json={})
        assert response.status_code == 400
        # The error message actually says "Email and password are required"
        # which is fine - just check that it contains both fields
        error_message = response.get_json().get('error', '').lower()
        assert 'email' in error_message and 'password' in error_message


def test_input_validation_register_missing_fields(app, monkeypatch):
    """Test input validation for register endpoint - missing fields"""
    # Disable rate limiter for this test
    monkeypatch.setattr('src.routes.auth_routes.limiter.enabled', False)
    with app.test_client() as client:
        response = client.post('/api/auth/register', json={
            'email': 'test@example.com',
            'password': 'Password123!'
        })
        assert response.status_code == 400
        assert 'name' in response.get_json().get('error', '').lower() or 'role' in response.get_json().get('error', '').lower()
        
def test_input_validation_register_invalid_email(app, monkeypatch):
    """Test input validation for register endpoint - invalid email"""
    # Disable rate limiter for this test
    monkeypatch.setattr('src.routes.auth_routes.limiter.enabled', False)
    with app.test_client() as client:
        response = client.post('/api/auth/register', json={
            'name': 'Test User',
            'email': 'not-an-email',
            'password': 'Password123!',
            'role': 'tenant'
        })
        assert response.status_code == 400
        assert 'email' in response.get_json().get('error', '').lower()
        
def test_input_validation_register_invalid_role(app, monkeypatch):
    """Test input validation for register endpoint - invalid role"""
    # Disable rate limiter for this test
    monkeypatch.setattr('src.routes.auth_routes.limiter.enabled', False)
    with app.test_client() as client:
        response = client.post('/api/auth/register', json={
            'name': 'Test User',
            'email': 'test@example.com',
            'password': 'Password123!',
            'role': 'invalid-role'
        })
        assert response.status_code == 400
        assert 'role' in response.get_json().get('error', '').lower()
