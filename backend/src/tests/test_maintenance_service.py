import pytest
from datetime import datetime

from ..services.maintenance_service import MaintenanceService
from ..models.maintenance_request import MaintenanceRequest
from ..models.tenant_property import TenantProperty

@pytest.fixture
def setup_tenant_property_relation(session, test_users, test_property):
    """Setup tenant-property relationship for maintenance tests"""
    tenant_property = TenantProperty(
        tenant_id=test_users['tenant'].id,
        property_id=test_property['property_id'],  # Use property_id instead of property.id
        unit_id=test_property['unit_ids'][0],  # Use unit_ids instead of units
        rent_amount=1000.0,  # Add required rent_amount field
        status='active',
        start_date=datetime.utcnow().date(),
        end_date=datetime.utcnow().replace(year=datetime.utcnow().year + 1).date()
    )
    session.add(tenant_property)
    session.commit()
    return tenant_property


def test_maintenance_service_create_request(session, test_users, test_property, setup_tenant_property_relation):
    """Test creating a maintenance request via service"""
    tenant_id = test_users['tenant'].id
    
    data = {
        'property_id': test_property['property_id'],  # Use property_id instead of property.id
        'title': 'Service Test Request',
        'description': 'This is a test maintenance request from service',
        'priority': 'high'
    }
    
    request, error = MaintenanceService.create_request(tenant_id, data)
    
    assert error is None
    assert request is not None
    assert request.tenant_id == tenant_id
    assert request.property_id == test_property['property_id']  # Use property_id instead of property.id
    assert request.title == 'Service Test Request'
    assert request.priority == 'high'
    assert request.status == 'open'


def test_maintenance_service_update_request(session, test_users, test_property, setup_tenant_property_relation):
    """Test updating a maintenance request via service"""
    # Create maintenance request
    request = MaintenanceRequest(
        tenant_id=test_users['tenant'].id,
        landlord_id=test_users['landlord'].id,
        property_id=test_property['property_id'],  # Use property_id instead of property.id
        unit_id=test_property['unit_ids'][0],  # Use unit_ids instead of units
        title='Update Test',
        description='Request to be updated',
        priority='medium',
        status='open',
        created_at=datetime.utcnow()
    )
    session.add(request)
    session.commit()
    
    # Update as landlord
    data = {
        'status': 'in_progress',
        'notes': 'Working on this issue'
    }
    
    updated, error = MaintenanceService.update_request(
        request_id=request.id,
        user_id=test_users['landlord'].id,
        is_landlord=True,
        data=data
    )
    
    assert error is None
    assert updated is not None
    assert updated.status == 'in_progress'
    assert updated.notes == 'Working on this issue'


def test_maintenance_service_tenant_update(session, test_users, test_property, setup_tenant_property_relation):
    """Test tenant updating a maintenance request via service"""
    # Create maintenance request
    request = MaintenanceRequest(
        tenant_id=test_users['tenant'].id,
        landlord_id=test_users['landlord'].id,
        property_id=test_property['property_id'],  # Use property_id instead of property.id
        unit_id=test_property['unit_ids'][0],  # Use unit_ids instead of units
        title='Tenant Update Test',
        description='Initial description',
        priority='low',
        status='open',
        created_at=datetime.utcnow()
    )
    session.add(request)
    session.commit()
    
    # Update as tenant
    data = {
        'description': 'Updated description',
        'priority': 'high'
    }
    
    updated, error = MaintenanceService.update_request(
        request_id=request.id,
        user_id=test_users['tenant'].id,
        is_landlord=False,
        data=data
    )
    
    assert error is None
    assert updated is not None
    assert updated.description == 'Updated description'
    assert updated.priority == 'high'
    # Status should not be changed by tenant
    assert updated.status == 'open'