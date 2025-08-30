import pytest
import json

def test_get_profile(client, test_users, auth_headers):
    """Test retrieving user profile"""
    print(f"TEST DEBUG - Auth headers for landlord: {auth_headers['landlord']}")
    response = client.get('/api/users/profile', 
                         headers=auth_headers['landlord'])
    
    print(f"TEST DEBUG - Response status: {response.status_code}")
    print(f"TEST DEBUG - Response data: {response.data}")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['user']['email'] == 'landlord@example.com'
    assert data['user']['role'] == 'landlord'


def test_update_profile(client, test_users, auth_headers):
    """Test updating user profile"""
    response = client.put('/api/users/profile',
                         headers=auth_headers['tenant'],
                         json={
                             'name': 'Updated Tenant Name',
                             'phone': '555-999-8888'
                         })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['user']['name'] == 'Updated Tenant Name'
    assert data['user']['phone'] == '555-999-8888'


def test_change_password(client, test_users, auth_headers):
    """Test changing user password"""
    response = client.put('/api/users/password',
                         headers=auth_headers['landlord'],
                         json={
                             'current_password': 'Password123!',
                             'new_password': 'NewPassword456!'
                         })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    
    # Test login with new password
    response = client.post('/api/auth/login', json={
        'email': 'landlord@example.com',
        'password': 'NewPassword456!'
    })
    
    assert response.status_code == 200


def test_unauthorized_access(client):
    """Test accessing endpoint without authentication"""
    response = client.get('/api/users/profile')
    
    assert response.status_code == 401
    data = json.loads(response.data)
    # Our custom JWT error handler uses 'message' and 'error' keys
    assert 'message' in data
    assert 'error' in data


def test_admin_get_users(client, test_users, auth_headers):
    """Test admin getting all users"""
    response = client.get('/api/admin/users',
                         headers=auth_headers['admin'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'users' in data
    assert len(data['users']) >= 3  # At least our 3 test users