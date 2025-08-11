import pytest
import json

def test_create_unit(client, test_users, auth_headers, test_property):
    """Test creating a unit for a property"""
    property_id = test_property['property'].id
    response = client.post('/api/units',
                          headers=auth_headers['landlord'],
                          json={
                              'property_id': property_id,
                              'unit_number': '201',
                              'bedrooms': 3,
                              'bathrooms': 2,
                              'square_feet': 1200,
                              'rent_amount': 1500
                          })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['unit']['unit_number'] == '201'
    assert data['unit']['property_id'] == property_id


def test_get_units_for_property(client, test_users, auth_headers, test_property):
    """Test getting all units for a property"""
    property_id = test_property['property'].id
    response = client.get(f'/api/units/property/{property_id}',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'units' in data
    assert len(data['units']) >= 3  # We created 3 units in the fixture


def test_update_unit(client, test_users, auth_headers, test_property):
    """Test updating a unit"""
    unit_id = test_property['units'][0].id
    response = client.put(f'/api/units/{unit_id}',
                         headers=auth_headers['landlord'],
                         json={
                             'rent_amount': 1300,
                             'status': 'maintenance'
                         })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['unit']['rent_amount'] == 1300
    assert data['unit']['status'] == 'maintenance'


def test_get_available_units(client, test_users, auth_headers, test_property):
    """Test filtering units by availability"""
    property_id = test_property['property'].id
    response = client.get(f'/api/units/available?property_id={property_id}',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'units' in data
    # We should have 2 available units from the fixture
    assert len([u for u in data['units'] if u['status'] == 'available']) == 2