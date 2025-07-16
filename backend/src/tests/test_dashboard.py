import pytest
import json

def test_landlord_dashboard(client, test_users, auth_headers, test_property):
    """Test getting landlord dashboard data"""
    response = client.get('/api/dashboard/landlord',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Check for expected dashboard sections
    assert 'properties' in data
    assert 'maintenance_requests' in data
    assert 'recent_activity' in data
    assert 'upcoming_lease_expirations' in data
    assert 'vacancy_stats' in data


def test_tenant_dashboard(client, test_users, auth_headers):
    """Test getting tenant dashboard data"""
    response = client.get('/api/dashboard/tenant',
                         headers=auth_headers['tenant'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Check for expected dashboard sections
    assert 'properties' in data
    assert 'maintenance_requests' in data
    assert 'recent_activity' in data
    assert 'upcoming_payments' in data


def test_dashboard_stats(client, test_users, auth_headers, test_property):
    """Test getting dashboard stats"""
    response = client.get('/api/dashboard/stats',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Check for stats data
    assert 'stats' in data
    assert 'property_count' in data['stats']
    assert 'tenant_count' in data['stats']
    assert 'vacancy_rate' in data['stats']
    assert 'revenue_current_month' in data['stats']