import pytest
import json
from datetime import datetime

from ..models.property import Property
from ..models.property_code import PropertyCode

@pytest.fixture
def test_property_code(session, test_property):
    """Create a test property code"""
    code = PropertyCode(
        property_id=test_property['property'].id,
        code="ABC123",
        expires_at=datetime.utcnow().replace(year=datetime.utcnow().year + 1),
        active=True
    )
    session.add(code)
    session.commit()
    return code


def test_onboard_with_property_code(client, test_property_code):
    """Test tenant onboarding with property code"""
    response = client.post('/api/onboard/tenant',
                         json={
                             'name': 'Code Tenant',
                             'email': 'code_tenant@example.com',
                             'password': 'Password123!',
                             'phone': '555-123-7890',
                             'property_code': test_property_code.code
                         })
    
    assert response.status_code in [200, 201]
    data = json.loads(response.data)
    assert 'user' in data
    assert data['user']['email'] == 'code_tenant@example.com'
    
    # Verify tenant was assigned to correct property
    assert 'property' in data
    assert data['property']['id'] == test_property_code.property_id


def test_invalid_property_code(client):
    """Test onboarding with invalid property code"""
    response = client.post('/api/onboard/tenant',
                         json={
                             'name': 'Invalid Code',
                             'email': 'invalid_code@example.com',
                             'password': 'Password123!',
                             'phone': '555-999-8888',
                             'property_code': 'INVALID'
                         })
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data