"""
Tests for the API endpoints.
"""
import pytest
import json
import os


def test_status_endpoint(client):
    """Test the status endpoint."""
    response = client.get('/api/status')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'online'

def test_auth_login(client, test_users):
    """Test login functionality."""
    # Ensure we have users before testing login
    response = client.post(
        '/api/auth/login',
        json={
            'email': 'admin@example.com',
            'password': 'Password123!'
        }
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'access_token' in data
    assert 'user' in data
    assert data['user']['email'] == 'admin@example.com'
    assert data['user']['is_active'] is True

def test_auth_login_invalid(client):
    """Test login with invalid credentials."""
    response = client.post(
        '/api/auth/login',
        json={
            'email': 'admin@example.com',
            'password': 'WrongPassword'
        }
    )
    assert response.status_code == 401

def test_protected_endpoint_no_token(client):
    """Test accessing protected endpoint without token."""
    response = client.get('/api/admin/users')
    assert response.status_code == 401

def test_protected_endpoint_with_token(client, admin_token):
    """Test accessing protected endpoint with valid token."""
    response = client.get(
        '/api/admin/users',
        headers={
            'Authorization': f'Bearer {admin_token}'
        }
    )
    assert response.status_code == 200

def test_role_required_endpoint(client, tenant_token):
    """Test accessing admin endpoint with tenant token."""
    response = client.get(
        '/api/admin/users',
        headers={
            'Authorization': f'Bearer {tenant_token}'
        }
    )
    assert response.status_code == 403