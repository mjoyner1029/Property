import pytest
import json
from datetime import datetime

from ..models.invitation import Invitation
from ..models.tenant_property import TenantProperty
from ..extensions import db


@pytest.fixture
def test_invitation(session, test_users, test_property):
    """Create test invitation"""
    invitation = Invitation(
        email='newtenant@example.com',
        role='tenant',
        invited_by=test_users['landlord'].id,
        property_id=test_property['property_id'],
        token='test-invitation-token',
        created_at=datetime.utcnow()
    )
    session.add(invitation)
    session.commit()
    return invitation


def test_invite_tenant(client, test_users, auth_headers, test_property):
    """Test inviting a new tenant"""
    response = client.post('/api/invites/tenant',
                          headers=auth_headers['landlord'],
                          json={
                              'email': 'invited_tenant@example.com',
                              'property_id': test_property['property_id'],
                              'unit_id': test_property['unit_ids'][0]
                          })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'invitation' in data
    assert data['invitation']['email'] == 'invited_tenant@example.com'


def test_invite_existing_tenant(client, test_users, auth_headers, test_property):
    """Test inviting an existing tenant"""
    response = client.post('/api/invites/tenant',
                          headers=auth_headers['landlord'],
                          json={
                              'email': test_users['tenant'].email,
                              'property_id': test_property['property_id'],
                              'unit_id': test_property['unit_ids'][0]
                          })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'tenant_id' in data
    assert data['tenant_id'] == test_users['tenant'].id
    
    # Check if tenant-property relationship was created
    tp = TenantProperty.query.filter_by(
        tenant_id=test_users['tenant'].id,
        property_id=test_property['property_id']
    ).first()
    assert tp is not None


def test_verify_invitation(client, test_invitation):
    """Test verifying an invitation token"""
    response = client.get(f'/api/invites/verify/{test_invitation.token}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'valid' in data
    assert data['valid'] is True
    assert 'invitation' in data
    assert data['invitation']['email'] == 'newtenant@example.com'


def test_unauthorized_invite(client, test_users, auth_headers, test_property):
    """Test tenant trying to invite someone"""
    response = client.post('/api/invites/tenant',
                          headers=auth_headers['tenant'],
                          json={
                              'email': 'someone@example.com',
                              'property_id': test_property['property_id']
                          })
    
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'error' in data