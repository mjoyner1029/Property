import pytest
from datetime import datetime, timedelta

from ..services.user_service import UserService
from ..models.user import User
from ..extensions import db


def test_user_service_get_user_by_id(session, test_users):
    """Test retrieving user by ID"""
    user_id = test_users['tenant'].id
    user = UserService.get_user_by_id(user_id)
    
    assert user is not None
    assert user.id == user_id
    assert user.email == test_users['tenant'].email


def test_user_service_get_user_by_email(session, test_users):
    """Test retrieving user by email"""
    email = test_users['landlord'].email
    user = UserService.get_user_by_email(email)
    
    assert user is not None
    assert user.email == email
    assert user.role == 'landlord'


def test_user_service_create_user(session):
    """Test creating a new user"""
    user, error = UserService.create_user(
        name="New Service User",
        email="new_service_user@example.com",
        password="Password123!",
        role="tenant"
    )
    
    assert error is None
    assert user is not None
    assert user.name == "New Service User"
    assert user.email == "new_service_user@example.com"
    assert user.role == "tenant"
    
    # Verify user exists in database
    db_user = User.query.filter_by(email="new_service_user@example.com").first()
    assert db_user is not None
    assert db_user.id == user.id


def test_user_service_verify_email(session):
    """Test email verification"""
    # Create user with verification token
    user, _ = UserService.create_user(
        name="Verification User",
        email="verify_me@example.com",
        password="Password123!",
        role="tenant"
    )
    
    token = user.verification_token
    assert token is not None
    
    # Verify email
    verified_user, error = UserService.verify_user_email(token)
    
    assert error is None
    assert verified_user is not None
    assert verified_user.is_verified is True
    assert verified_user.email_verified_at is not None
    
    # Token should be cleared
    assert verified_user.verification_token is None


def test_user_service_password_reset(session, test_users):
    """Test password reset flow"""
    user_id = test_users['tenant'].id
    email = test_users['tenant'].email
    
    # Generate reset token
    token, error = UserService.generate_password_reset_token(email)
    
    assert error is None
    assert token is not None
    
    # Get user and check token
    user = db.session.get(User, user_id)
    assert user.reset_token == token
    assert user.reset_token_expiry > datetime.utcnow()
    
    # Reset password with token
    updated_user, error = UserService.reset_password_with_token(token, "NewPassword456!")
    
    assert error is None
    assert updated_user is not None
    assert updated_user.id == user_id
    assert updated_user.reset_token is None
    assert updated_user.reset_token_expiry is None