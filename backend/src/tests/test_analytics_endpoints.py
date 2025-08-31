"""
Test script to verify analytics endpoints are working correctly
"""
import pytest
import json
from datetime import datetime

def test_analytics_endpoints(client, auth_headers):
    """Test all analytics endpoints"""
    
    # Test dashboard endpoint
    response = client.get('/api/analytics/dashboard', 
                         headers=auth_headers['landlord'])
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'stats' in data
    
    # Test revenue endpoint
    response = client.get('/api/analytics/revenue', 
                         headers=auth_headers['landlord'])
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'revenue_data' in data
    
    # Test occupancy endpoint
    response = client.get('/api/analytics/occupancy', 
                         headers=auth_headers['landlord'])
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'occupancy_data' in data
    
    # Test maintenance endpoint
    response = client.get('/api/analytics/maintenance', 
                         headers=auth_headers['landlord'])
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'maintenance_data' in data
    
    # Test tenants endpoint
    response = client.get('/api/analytics/tenants', 
                         headers=auth_headers['landlord'])
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'tenant_data' in data
    
    # Test property endpoint - assume we have at least one property
    # First get properties to find a property ID
    response = client.get('/api/properties', 
                         headers=auth_headers['landlord'])
    assert response.status_code == 200
    properties_data = json.loads(response.data)
    
    # If we have properties, test the property analytics endpoint
    if properties_data and isinstance(properties_data, list) and len(properties_data) > 0:
        property_id = properties_data[0]['id']
        
        response = client.get(f'/api/analytics/property/{property_id}', 
                             headers=auth_headers['landlord'])
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'property' in data
        assert 'occupancy' in data
        assert 'financial' in data
        assert 'maintenance' in data
