import pytest
import json
from datetime import datetime, timedelta

from ..models.lease import Lease
from ..models.tenant_property import TenantProperty

def test_create_lease(client, test_users, auth_headers, test_property):
    """Test creating a lease agreement"""
    start_date = datetime.utcnow().date()
    end_date = (datetime.utcnow() + timedelta(days=365)).date()
    
    response = client.post('/api/leases',
                          headers=auth_headers['landlord'],
                          json={
                              'tenant_id': test_users['tenant'].id,
                              'property_id': test_property['property'].id,
                              'unit_id': test_property['units'][0].id,
                              'start_date': start_date.strftime('%Y-%m-%d'),
                              'end_date': end_date.strftime('%Y-%m-%d'),
                              'rent_amount': 1200.00,
                              'security_deposit': 1200.00,
                              'payment_day': 1,
                              'terms': 'Monthly payment due on the 1st'
                          })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['lease']['tenant_id'] == test_users['tenant'].id
    assert data['lease']['property_id'] == test_property['property'].id
    assert data['lease']['status'] == 'pending'


def test_accept_lease(client, test_users, auth_headers, session, test_property):
    """Test tenant accepting a lease agreement"""
    # Create a lease for testing
    start_date = datetime.utcnow().date()
    end_date = (datetime.utcnow() + timedelta(days=365)).date()
    
    lease = Lease(
        tenant_id=test_users['tenant'].id,
        landlord_id=test_users['landlord'].id,
        property_id=test_property['property'].id,
        unit_id=test_property['units'][0].id,
        start_date=start_date,
        end_date=end_date,
        rent_amount=1200.00,
        security_deposit=1200.00,
        status='pending',
        payment_day=1,
        rent_cycle='monthly',
        created_at=datetime.utcnow()
    )
    session.add(lease)
    session.commit()
    
    # Accept the lease
    response = client.put(f'/api/leases/{lease.id}/accept',
                         headers=auth_headers['tenant'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['lease']['status'] == 'active'
    
    # Verify tenant-property relationship was created
    tenant_property = TenantProperty.query.filter_by(
        tenant_id=test_users['tenant'].id,
        property_id=test_property['property'].id
    ).first()
    
    assert tenant_property is not None
    assert tenant_property.status == 'active'


def test_terminate_lease(client, test_users, auth_headers, session, test_property):
    """Test terminating a lease agreement"""
    # Create an active lease for testing
    start_date = datetime.utcnow().date()
    end_date = (datetime.utcnow() + timedelta(days=365)).date()
    
    lease = Lease(
        tenant_id=test_users['tenant'].id,
        landlord_id=test_users['landlord'].id,
        property_id=test_property['property'].id,
        unit_id=test_property['units'][0].id,
        start_date=start_date,
        end_date=end_date,
        rent_amount=1200.00,
        security_deposit=1200.00,
        status='active',
        payment_day=1,
        rent_cycle='monthly',
        created_at=datetime.utcnow(),
        accepted_at=datetime.utcnow()
    )
    session.add(lease)
    
    # Create tenant-property relationship
    tenant_property = TenantProperty(
        tenant_id=test_users['tenant'].id,
        property_id=test_property['property'].id,
        unit_id=test_property['units'][0].id,
        status='active',
        start_date=start_date,
        end_date=end_date
    )
    session.add(tenant_property)
    session.commit()
    
    # Terminate the lease
    response = client.put(f'/api/leases/{lease.id}/terminate',
                         headers=auth_headers['landlord'],
                         json={
                             'reason': 'Tenant requested early termination'
                         })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['lease']['status'] == 'terminated'
    assert 'termination_date' in data['lease']
    
    # Verify tenant-property relationship was updated
    tenant_property = TenantProperty.query.filter_by(
        tenant_id=test_users['tenant'].id,
        property_id=test_property['property'].id
    ).first()
    
    assert tenant_property.status == 'inactive'