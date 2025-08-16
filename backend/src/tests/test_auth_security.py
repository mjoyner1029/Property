import pytest
import json
import time
from flask_jwt_extended import decode_token

def test_password_complexity(client):
    """Test that password complexity requirements are enforced"""
    # Test password without uppercase
    response = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'weak1@example.com',
        'password': 'password123!',
        'role': 'tenant'
    })
    assert response.status_code == 400
    
    # Test password without lowercase
    response = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'weak2@example.com',
        'password': 'PASSWORD123!',
        'role': 'tenant'
    })
    assert response.status_code == 400
    
    # Test password without number
    response = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'weak3@example.com',
        'password': 'Password!',
        'role': 'tenant'
    })
    assert response.status_code == 400
    
    # Test password without special character
    response = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'weak4@example.com',
        'password': 'Password123',
        'role': 'tenant'
    })
    assert response.status_code == 400
    
    # Test password too short
    response = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'weak5@example.com',
        'password': 'Pass1!',
        'role': 'tenant'
    })
    assert response.status_code == 400
    
    # Test valid password
    response = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'valid@example.com',
        'password': 'Password123!',
        'role': 'tenant'
    })
    assert response.status_code == 201


def test_account_lockout(client, test_users):
    """Test that accounts are locked after multiple failed login attempts"""
    # Make multiple failed login attempts
    for i in range(5):  # Assuming lockout threshold is 5
        response = client.post('/api/auth/login', json={
            'email': 'landlord@example.com',
            'password': f'WrongPassword{i}!'
        })
        assert response.status_code in [401, 403]  # Either unauthorized or forbidden
    
    # Now even with correct password, the account should be locked
    response = client.post('/api/auth/login', json={
        'email': 'landlord@example.com',
        'password': 'Password123!'  # Correct password
    })
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'error' in data
    assert 'locked' in data['error'].lower() or 'attempts' in data['error'].lower()


def test_jwt_expiration(client, test_users):
    """Test that JWT tokens have proper expiration times"""
    # Login to get a token
    response = client.post('/api/auth/login', json={
        'email': 'landlord@example.com',
        'password': 'Password123!'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'access_token' in data
    
    # Decode the token and check expiration
    from flask import current_app
    with client.application.app_context():
        token = data['access_token']
        decoded = decode_token(token)
        
        # Check that token has an expiration claim
        assert 'exp' in decoded
        
        # Check that expiration is reasonable (not too long)
        # Assuming the token should expire within 24 hours
        assert decoded['exp'] - decoded['iat'] <= 86400  # 24 hours in seconds


def test_session_timeout(client, test_users):
    """Test that sessions timeout after inactivity"""
    # This is harder to test directly in pytest, but we can check the token expiration
    # which is a proxy for session timeout in JWT-based auth
    response = client.post('/api/auth/login', json={
        'email': 'landlord@example.com',
        'password': 'Password123!'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Make sure the token has a reasonable expiration
    with client.application.app_context():
        token = data['access_token']
        decoded = decode_token(token)
        
        # Session timeout should be set to around 30 minutes (1800 seconds)
        # Allow some flexibility in the exact value
        token_lifetime = decoded['exp'] - decoded['iat']
        assert 1700 <= token_lifetime <= 1900  # ~30 minutes
        
        
def test_input_validation_login(client):
    """Test input validation for login endpoint"""
    # Test missing email
    response = client.post('/api/auth/login', json={
        'password': 'Password123!'
    })
    assert response.status_code == 400
    
    # Test invalid email format
    response = client.post('/api/auth/login', json={
        'email': 'not-an-email',
        'password': 'Password123!'
    })
    assert response.status_code == 400
    
    # Test missing password
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com'
    })
    assert response.status_code == 400
    
    # Test empty payload
    response = client.post('/api/auth/login', json={})
    assert response.status_code == 400


def test_input_validation_register(client):
    """Test input validation for register endpoint"""
    # Test missing required fields
    response = client.post('/api/auth/register', json={
        'email': 'test@example.com',
        'password': 'Password123!'
    })
    assert response.status_code == 400
    
    # Test invalid email format
    response = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'not-an-email',
        'password': 'Password123!',
        'role': 'tenant'
    })
    assert response.status_code == 400
    
    # Test invalid role
    response = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'test@example.com',
        'password': 'Password123!',
        'role': 'invalid-role'
    })
    assert response.status_code == 400
