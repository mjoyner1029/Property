import pytest
from datetime import datetime, timedelta

from ..services.user_service import UserService
from ..services.property_service import PropertyService
from ..services.payment_service import PaymentService
from ..services.notification_service import NotificationService

def test_user_service_create_user(session):
    """Test user creation via service layer"""
    user, error = UserService.create_user(
        name="Service Test User",
        email="service_test@example.com",
        password="Password123!",
        role="tenant"
    )
    
    assert error is None
    assert user is not None
    assert user.email == "service_test@example.com"
    assert user.role == "tenant"
    assert user.is_verified is False


def test_user_service_verify_email(session):
    """Test email verification via service layer"""
    # Create user first
    user, _ = UserService.create_user(
        name="Verification Test",
        email="verify_test@example.com",
        password="Password123!",
        role="tenant"
    )
    
    # Get the verification token
    token = user.verification_token
    
    # Verify email
    verified_user, error = UserService.verify_user_email(token)
    
    assert error is None
    assert verified_user is not None
    assert verified_user.is_verified is True
    assert verified_user.email_verified_at is not None


def test_property_service_create_property(session, test_users):
    """Test property creation via service layer"""
    landlord_id = test_users['landlord'].id
    
    property_data = {
        'name': 'Service Test Property',
        'address': '123 Service St',
        'city': 'Service City',
        'state': 'SC',
        'zip_code': '12345',
        'property_type': 'apartment',
        'units': [
            {
                'unit_number': 'A1',
                'bedrooms': 2,
                'bathrooms': 1,
                'square_feet': 800,
                'rent_amount': 1200
            }
        ]
    }
    
    property, error = PropertyService.create_property(landlord_id, property_data)
    
    assert error is None
    assert property is not None
    assert property.name == 'Service Test Property'
    assert property.landlord_id == landlord_id


def test_notification_service_create_notification(session, test_users):
    """Test notification creation via service layer"""
    user_id = test_users['tenant'].id
    
    notification, error = NotificationService.create_notification(
        user_id=user_id,
        notification_type="info",
        title="Test Notification",
        message="This is a test notification",
        data={"test_key": "test_value"}
    )
    
    assert error is None
    assert notification is not None
    assert notification.user_id == user_id
    assert notification.title == "Test Notification"
    assert notification.read is False