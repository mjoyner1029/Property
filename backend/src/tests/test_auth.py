import pytest
import json

def test_login_success(client, test_users):
    """Test successful user login"""
    response = client.post('/api/auth/login', json={
        'email': 'landlord@example.com',
        'password': 'Password123!'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'access_token' in data
    assert 'user' in data
    assert data['user']['email'] == 'landlord@example.com'


def test_login_invalid_credentials(client):
    """Test login with invalid credentials"""
    response = client.post('/api/auth/login', json={
        'email': 'landlord@example.com',
        'password': 'WrongPassword123!'
    })
    
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'error' in data


def test_register_success(client):
    """Test successful user registration"""
    response = client.post('/api/auth/register', json={
        'name': 'New User',
        'email': 'new@example.com',
        'password': 'Password123!',
        'role': 'tenant'
    })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'message' in data
    assert data['user']['email'] == 'new@example.com'


def test_register_duplicate_email(client, test_users):
    """Test registration with existing email"""
    response = client.post('/api/auth/register', json={
        'name': 'Duplicate User',
        'email': 'landlord@example.com',  # Already exists
        'password': 'Password123!',
        'role': 'tenant'
    })
    
    assert response.status_code == 409
    data = json.loads(response.data)
    assert 'error' in data


def test_password_reset_request(client, test_users):
    """Test password reset request"""
    response = client.post('/api/auth/password/reset-request', json={
        'email': 'landlord@example.com'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data


def test_verify_token_valid(client, test_users, app):
    """Test email verification token validation"""
    # This is a more complex test that would need to create a valid token
    # Similar logic would be applied for testing password reset token validation
    pass