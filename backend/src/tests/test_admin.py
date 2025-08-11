import pytest
import json

from ..models.user import User

def test_admin_get_users(client, test_users, auth_headers):
    """Test admin getting all users"""
    response = client.get('/api/admin/users',
                         headers=auth_headers['admin'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'users' in data
    assert len(data['users']) >= 3  # At least our test users


def test_admin_get_user(client, test_users, auth_headers):
    """Test admin getting a specific user"""
    user_id = test_users['tenant'].id
    
    response = client.get(f'/api/admin/users/{user_id}',
                         headers=auth_headers['admin'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'user' in data
    assert data['user']['id'] == user_id
    assert data['user']['email'] == test_users['tenant'].email


def test_admin_update_user(client, test_users, auth_headers):
    """Test admin updating a user"""
    user_id = test_users['tenant'].id
    
    response = client.put(f'/api/admin/users/{user_id}',
                         headers=auth_headers['admin'],
                         json={
                             'name': 'Updated By Admin',
                             'is_active': True
                         })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'user' in data
    assert data['user']['name'] == 'Updated By Admin'
    
    # Verify in database
    updated_user = User.query.get(user_id)
    assert updated_user.name == 'Updated By Admin'


def test_admin_get_system_stats(client, auth_headers):
    """Test getting system statistics"""
    response = client.get('/api/admin/stats',
                         headers=auth_headers['admin'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'stats' in data
    assert 'user_count' in data['stats']
    assert 'property_count' in data['stats']


def test_non_admin_access(client, auth_headers):
    """Test non-admin trying to access admin endpoints"""
    response = client.get('/api/admin/users',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'error' in data