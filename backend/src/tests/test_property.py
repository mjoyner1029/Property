import pytest
import json

def test_create_property(client, test_users, auth_headers):
    """Test creating a property"""
    response = client.post('/api/properties',
                          headers=auth_headers['landlord'],
                          json={
                              'name': 'New Test Property',
                              'address': '789 New Street',
                              'city': 'New City',
                              'state': 'NC',
                              'zip_code': '54321',
                              'property_type': 'single_family'
                          })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['property']['name'] == 'New Test Property'
    assert 'id' in data['property']


def test_get_property(client, test_users, auth_headers, test_property):
    """Test getting a single property"""
    property_id = test_property['property'].id
    response = client.get(f'/api/properties/{property_id}',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['property']['id'] == property_id
    assert data['property']['name'] == 'Test Property'


def test_update_property(client, test_users, auth_headers, test_property):
    """Test updating a property"""
    property_id = test_property['property'].id
    response = client.put(f'/api/properties/{property_id}',
                         headers=auth_headers['landlord'],
                         json={
                             'name': 'Updated Property Name',
                             'description': 'New property description'
                         })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['property']['name'] == 'Updated Property Name'
    assert data['property']['description'] == 'New property description'


def test_get_landlord_properties(client, test_users, auth_headers, test_property):
    """Test getting all properties for a landlord"""
    response = client.get('/api/properties/landlord',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'properties' in data
    assert len(data['properties']) >= 1
    assert data['properties'][0]['name'] == 'Test Property'


def test_unauthorized_property_update(client, test_users, auth_headers, test_property):
    """Test updating a property without permission"""
    property_id = test_property['property'].id
    response = client.put(f'/api/properties/{property_id}',
                         headers=auth_headers['tenant'],  # Tenant trying to update
                         json={
                             'name': 'Unauthorized Update'
                         })
    
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'error' in data