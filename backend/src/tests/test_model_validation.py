import pytest
from datetime import datetime

from ..models.user import User
from ..models.property import Property
from ..models.invoice import Invoice
from ..models.lease import Lease
from ..models.maintenance_request import MaintenanceRequest
from ..extensions import db

def test_user_model_validation(session):
    """Test User model validation"""
    # Test missing required fields
    user = User()  # Missing required fields
    
    with pytest.raises(Exception) as excinfo:
        session.add(user)
        session.flush()
    
    session.rollback()
    
    # Test email uniqueness
    user1 = User(
        email='test_unique@example.com',
        name='Test User 1',
        password='password',
        role='tenant'
    )
    session.add(user1)
    session.flush()
    
    user2 = User(
        email='test_unique@example.com',  # Same email
        name='Test User 2',
        password='password',
        role='tenant'
    )
    
    with pytest.raises(Exception) as excinfo:
        session.add(user2)
        session.flush()
        
    session.rollback()
    
    # Test invalid role
    user3 = User(
        email='test_role@example.com',
        name='Test User 3',
        password='password',
        role='invalid_role'  # Invalid role
    )
    
    with pytest.raises(Exception) as excinfo:
        session.add(user3)
        session.flush()
        
    session.rollback()


def test_property_model_validation(session, test_users):
    """Test Property model validation"""
    # Test missing required fields
    property = Property()  # Missing required fields
    
    with pytest.raises(Exception) as excinfo:
        session.add(property)
        session.flush()
    
    session.rollback()
    
    # Test valid property
    property = Property(
        name='Valid Property',
        address='123 Valid St',
        city='Valid City',
        state='VS',
        zip_code='12345',
        landlord_id=test_users['landlord'].id
    )
    
    session.add(property)
    session.flush()
    assert property.id is not None
    
    session.rollback()


def test_invoice_model_validation(session, test_users, test_property):
    """Test Invoice model validation"""
    # Test missing required fields
    invoice = Invoice()  # Missing required fields
    
    with pytest.raises(Exception) as excinfo:
        session.add(invoice)
        session.flush()
    
    session.rollback()
    
    # Test valid invoice
    invoice = Invoice(
        landlord_id=test_users['landlord'].id,
        tenant_id=test_users['tenant'].id,
        property_id=test_property['property'].id,
        amount=1000.00,
        description='Valid invoice',
        due_date=datetime.utcnow().date(),
        status='due',
        invoice_number='TEST-VALID-1'
    )
    
    session.add(invoice)
    session.flush()
    assert invoice.id is not None
    
    session.rollback()


def test_lease_model_validation(session, test_users, test_property):
    """Test Lease model validation"""
    # Test end_date before start_date
    lease = Lease(
        tenant_id=test_users['tenant'].id,
        landlord_id=test_users['landlord'].id,
        property_id=test_property['property'].id,
        start_date=datetime(2023, 1, 15).date(),
        end_date=datetime(2023, 1, 10).date(),  # End date before start date
        rent_amount=1200.00
    )
    
    with pytest.raises(Exception) as excinfo:
        session.add(lease)
        session.flush()
    
    session.rollback()
    
    # Test valid lease
    lease = Lease(
        tenant_id=test_users['tenant'].id,
        landlord_id=test_users['landlord'].id,
        property_id=test_property['property'].id,
        start_date=datetime(2023, 1, 1).date(),
        end_date=datetime(2023, 12, 31).date(),
        rent_amount=1200.00,
        status='pending'
    )
    
    session.add(lease)
    session.flush()
    assert lease.id is not None
    
    session.rollback()


def test_maintenance_request_validation(session, test_users, test_property):
    """Test MaintenanceRequest model validation"""
    # Test invalid priority
    request = MaintenanceRequest(
        tenant_id=test_users['tenant'].id,
        landlord_id=test_users['landlord'].id,
        property_id=test_property['property'].id,
        title='Test Request',
        description='Test description',
        priority='invalid_priority',  # Invalid priority
        status='open'
    )
    
    with pytest.raises(Exception) as excinfo:
        session.add(request)
        session.flush()
    
    session.rollback()
    
    # Test valid request
    request = MaintenanceRequest(
        tenant_id=test_users['tenant'].id,
        landlord_id=test_users['landlord'].id,
        property_id=test_property['property'].id,
        title='Valid Request',
        description='Valid description',
        priority='high',
        status='open'
    )
    
    session.add(request)
    session.flush()
    assert request.id is not None
    
    session.rollback()