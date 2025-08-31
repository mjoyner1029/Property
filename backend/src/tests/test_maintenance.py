import pytest
import json
from datetime import datetime

from ..models.maintenance_request import MaintenanceRequest
from ..models.tenant_property import TenantProperty

@pytest.fixture(scope='function')
def setup_tenant_property(session, test_users, test_property):
    """Setup tenant-property relationship for maintenance tests"""
    # Associate the tenant with the property
    tenant_property = TenantProperty(
        tenant_id=test_users['tenant'].id,
        property_id=test_property['property_id'],
        unit_id=test_property['unit_ids'][0],
        status='active',
        start_date=datetime.utcnow().date(),
        end_date=datetime.utcnow().replace(year=datetime.utcnow().year + 1).date(),
        rent_amount=1200
    )
    session.add(tenant_property)
    session.commit()
    return tenant_property

@pytest.fixture(scope='function')
def test_maintenance_request(session, test_users, test_property, setup_tenant_property):
    """Create test maintenance request for testing"""
    request = MaintenanceRequest(
        tenant_id=test_users['tenant'].id,
        landlord_id=test_users['landlord'].id,
        property_id=test_property['property_id'],
        unit_id=test_property['unit_ids'][0],
        title='Test Request',
        description='This is a test maintenance request',
        priority='medium',
        status='open',
        created_at=datetime.utcnow()
    )
    session.add(request)
    session.commit()
    return request


def test_create_maintenance_request(client, test_users, auth_headers, test_property, setup_tenant_property):
    """Test creating a maintenance request"""
    response = client.post('/api/maintenance',
                          headers=auth_headers['tenant'],
                          json={
                              'property_id': test_property['property_id'],
                              'title': 'New Maintenance Issue',
                              'description': 'The sink is leaking',
                              'priority': 'high'
                          })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['request']['title'] == 'New Maintenance Issue'
    assert data['request']['status'] == 'open'


def test_get_tenant_maintenance_requests(client, test_users, auth_headers, test_maintenance_request):
    """Test getting maintenance requests for a tenant"""
    response = client.get('/api/maintenance/tenant',
                         headers=auth_headers['tenant'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'requests' in data
    assert len(data['requests']) >= 1
    
    # Find the request with title 'Test Request' in the list
    test_request_found = False
    for request in data['requests']:
        if request['title'] == 'Test Request':
            test_request_found = True
            break
    
    assert test_request_found, f"Test request with title 'Test Request' not found in response: {data['requests']}"


def test_get_landlord_maintenance_requests(client, test_users, auth_headers, test_maintenance_request):
    """Test getting maintenance requests for a landlord"""
    response = client.get('/api/maintenance/landlord',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'requests' in data
    assert len(data['requests']) >= 1


def test_update_maintenance_request(client, test_users, auth_headers, test_maintenance_request):
    """Test updating a maintenance request"""
    request_id = test_maintenance_request.id
    response = client.put(f'/api/maintenance/{request_id}',
                         headers=auth_headers['landlord'],
                         json={
                             'status': 'in_progress',
                             'notes': 'Scheduled for tomorrow'
                         })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['request']['status'] == 'in_progress'
    assert data['request']['notes'] == 'Scheduled for tomorrow'


def test_complete_maintenance_request(client, test_users, auth_headers, test_maintenance_request):
    """Test marking a maintenance request as completed"""
    request_id = test_maintenance_request.id
    response = client.put(f'/api/maintenance/{request_id}/complete',
                         headers=auth_headers['landlord'],
                         json={
                             'notes': 'Fixed the issue'
                         })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['request']['status'] == 'completed'
    assert 'completed_at' in data['request']