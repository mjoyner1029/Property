import pytest
from itsdangerous import URLSafeTimedSerializer
from flask import current_app

from ..models.user import User
from ..extensions import db
from ..services.user_service import UserService

def test_manual_email_verification_token(client, app):
    """Test manually creating and verifying an email token"""
    with app.app_context():
        # Create an unverified user
        user = User(
            email="token_test@example.com",
            password="hashed_password",  # In a real app this would be hashed
            name="Token Test User",
            role="tenant",
            is_verified=False
        )
        # Set verification token directly
        s = URLSafeTimedSerializer(app.config["JWT_SECRET_KEY"])
        token = s.dumps(user.email, salt="email-verify")
        user.verification_token = token
        
        db.session.add(user)
        db.session.commit()
    
    # Test the verification endpoint
    response = client.get(f"/api/users/verify-email/{token}")
    assert response.status_code == 200
    
    with app.app_context():
        # Verify user status was updated
        updated_user = User.query.filter_by(email="token_test@example.com").first()
        assert updated_user.is_verified is True
        assert updated_user.email_verified_at is not None


def test_service_email_verification_flow(client, app):
    """Test the complete email verification flow using service"""
    with app.app_context():
        # Create an unverified user
        user, error = UserService.create_user(
            name="Service Verify User",
            email="service_verify@example.com",
            password="Password123!",
            role="tenant"
        )
        
        assert error is None
        assert user.is_verified is False
        assert user.verification_token is not None
        
        # Retrieve the token
        token = user.verification_token
    
    # Test the verification endpoint
    response = client.get(f"/api/users/verify-email/{token}")
    assert response.status_code == 200
    
    with app.app_context():
        # Verify user status was updated
        updated_user = User.query.filter_by(email="service_verify@example.com").first()
        assert updated_user.is_verified is True
        assert updated_user.email_verified_at is not None
        assert updated_user.verification_token is None