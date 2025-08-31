import pytest
import json
from datetime import datetime
from src.models.property_code import PropertyCode
from src.models.tenant_profile import TenantProfile
from src.models.property import Property
from src.models.user import User
from src.extensions import db

# We're creating all test data directly in each test now
# Fixtures are removed to avoid session issues

def test_property_code_validation(client, app):
    """Test the property code validation endpoint"""
    with app.app_context():
        # Create test data directly in the test
        import uuid
        unique_id = uuid.uuid4().hex[:8]
        
        # Create landlord
        landlord = User(
            name="Test Landlord",
            email=f"landlord_test_{unique_id}@example.com",
            password="Password123!",
            role="landlord"
        )
        db.session.add(landlord)
        db.session.flush()
        
        # Create property
        test_property = Property(
            name=f"Test Property {unique_id}",
            address="123 Test St",
            city="Testville",
            state="TS",
            zip_code="12345",
            landlord_id=landlord.id,
            status="active"
        )
        db.session.add(test_property)
        db.session.flush()
        
        # Create property code
        unique_code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        code = PropertyCode(
            property_id=test_property.id,
            code=unique_code,
            expires_at=datetime.utcnow().replace(year=datetime.utcnow().year + 1),
            active=True
        )
        db.session.add(code)
        db.session.commit()
        
        # Test the endpoint
        response = client.post('/api/onboard/property-code',
                            json={
                                'property_code': unique_code
                            })
    
    assert response.status_code in [200, 201]
    data = json.loads(response.data)
    assert 'property_id' in data
    assert 'property_name' in data
    assert 'linked' in data
    assert data['linked'] is False  # No user_id was provided, so no linking

def test_property_code_linking(client, app):
    """Test linking a user to a property via property code"""
    with app.app_context():
        # Create test data directly in the test
        import uuid
        unique_id = uuid.uuid4().hex[:8]
        
        # Create landlord
        landlord = User(
            name="Test Landlord",
            email=f"landlord_test_{unique_id}@example.com",
            password="Password123!",
            role="landlord"
        )
        db.session.add(landlord)
        db.session.flush()
        
        # Create property
        test_property = Property(
            name=f"Test Property {unique_id}",
            address="123 Test St",
            city="Testville",
            state="TS",
            zip_code="12345",
            landlord_id=landlord.id,
            status="active"
        )
        db.session.add(test_property)
        db.session.flush()
        
        # Create property code
        unique_code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        code = PropertyCode(
            property_id=test_property.id,
            code=unique_code,
            expires_at=datetime.utcnow().replace(year=datetime.utcnow().year + 1),
            active=True
        )
        
        # Create tenant user
        tenant = User(
            name="Test Tenant",
            email=f"tenant_test_{unique_id}@example.com",
            password="Password123!",
            role="tenant"
        )
        db.session.add(code)
        db.session.add(tenant)
        db.session.commit()
        
        # Test the endpoint
        response = client.post('/api/onboard/property-code',
                            json={
                                'property_code': unique_code,
                                'user_id': tenant.id
                            })
    
        assert response.status_code in [200, 201]
        data = json.loads(response.data)
        assert 'property_id' in data
        assert 'linked' in data
        assert data['linked'] is True
        
        # Verify the user was actually linked to the property
        from src.models.tenant_property import TenantProperty
        tenant_profile = TenantProfile.query.filter_by(user_id=tenant.id).first()
        assert tenant_profile is not None
        
        # Check tenant-property association
        tenant_property = TenantProperty.query.filter_by(tenant_id=tenant.id, property_id=data['property_id']).first()
        assert tenant_property is not None
        assert tenant_property.property_id == data['property_id']

def test_invalid_property_code_validation(client):
    """Test validation with invalid property code"""
    response = client.post('/api/onboard/property-code',
                         json={
                             'property_code': 'INVALID'
                         })
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Invalid property code' in data['error']

def test_missing_property_code(client):
    """Test validation without property code"""
    response = client.post('/api/onboard/property-code',
                         json={})
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Missing property_code parameter' in data['error']

def test_nonexistent_user_linking(client, app):
    """Test linking a nonexistent user to a property"""
    with app.app_context():
        # Create test data directly in the test
        import uuid
        unique_id = uuid.uuid4().hex[:8]
        
        # Create landlord
        landlord = User(
            name="Test Landlord",
            email=f"landlord_test_{unique_id}@example.com",
            password="Password123!",
            role="landlord"
        )
        db.session.add(landlord)
        db.session.flush()
        
        # Create property
        test_property = Property(
            name=f"Test Property {unique_id}",
            address="123 Test St",
            city="Testville",
            state="TS",
            zip_code="12345",
            landlord_id=landlord.id,
            status="active"
        )
        db.session.add(test_property)
        db.session.flush()
        
        # Create property code
        unique_code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        code = PropertyCode(
            property_id=test_property.id,
            code=unique_code,
            expires_at=datetime.utcnow().replace(year=datetime.utcnow().year + 1),
            active=True
        )
        db.session.add(code)
        db.session.commit()
        
        # Test the endpoint with a nonexistent user ID
        response = client.post('/api/onboard/property-code',
                            json={
                                'property_code': unique_code,
                                'user_id': 99999  # This ID should not exist
                            })
    
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data
    assert 'User not found' in data['error']

def test_expired_property_code(client, app):
    """Test validation with expired property code"""
    with app.app_context():
        # Create test data directly in the test
        import uuid
        unique_id = uuid.uuid4().hex[:8]
        
        # Create landlord
        landlord = User(
            name="Test Landlord",
            email=f"landlord_test_{unique_id}@example.com",
            password="Password123!",
            role="landlord"
        )
        db.session.add(landlord)
        db.session.flush()
        
        # Create property
        test_property = Property(
            name=f"Test Property {unique_id}",
            address="123 Test St",
            city="Testville",
            state="TS",
            zip_code="12345",
            landlord_id=landlord.id,
            status="active"
        )
        db.session.add(test_property)
        db.session.flush()
        
        # Create inactive property code
        unique_code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        code = PropertyCode(
            property_id=test_property.id,
            code=unique_code,
            expires_at=datetime.utcnow().replace(year=datetime.utcnow().year + 1),
            active=False  # Set to inactive
        )
        db.session.add(code)
        db.session.commit()
        
        # Test the endpoint
        response = client.post('/api/onboard/property-code',
                            json={
                                'property_code': unique_code
                            })
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Invalid property code' in data['error']
    
    # Each test uses its own fixture instance so no need to restore
