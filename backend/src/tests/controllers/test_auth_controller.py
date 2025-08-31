"""
Tests for the auth controller
"""
import json
import pytest
from unittest.mock import patch, MagicMock, PropertyMock
from werkzeug.security import generate_password_hash

from src.controllers.auth_controller import register_user, authenticate_user


@pytest.fixture
def mock_db_session():
    """Mock database session."""
    session = MagicMock()
    return session


def test_register_success(app, mock_db_session):
    """Test successful user registration."""
    with app.test_request_context():
        # Mock the User.query directly since that's what's used in the controller
        with patch('src.controllers.auth_controller.User.query') as mock_user_query:
            # Set up mocks for user query
            mock_user_query.filter_by().first.return_value = None  # User doesn't exist yet
            
            # Mock the database session
            with patch('src.controllers.auth_controller.db.session', mock_db_session):
                # Mock the email validation function to always return True
                with patch('src.controllers.auth_controller.validate_email', return_value=True):
                    # Mock the password validation function to always return True
                    with patch('src.controllers.auth_controller.validate_password_strength', return_value=True):
                        # Call the function with direct parameters
                        result = register_user(
                            email="test@example.com",
                            password="securepassword",
                            full_name="Test User",
                            role="tenant"
                        )
            
            # Assertions
            assert result[1] == 201
            assert "User registered successfully" in result[0]['message']
            
            # Verify a user was created and added to the session
            mock_db_session.add.assert_called_once()
            mock_db_session.commit.assert_called_once()


def test_register_user_exists(app, mock_db_session):
    """Test registration when user already exists."""
    with app.test_request_context():
        with patch('src.controllers.auth_controller.db.session', mock_db_session):
            # Set up mock to indicate user already exists
            mock_db_session.query().filter().first.return_value = MagicMock()
            
            # Call the function with direct parameters
            result = register_user(
                email="existing@example.com",
                password="securepassword",
                full_name="Existing User",
                role="tenant"
            )
            
            # Assertions
            assert result[1] == 400
            assert "Email already exists" in result[0]['error']
            
            # Verify no user was added to the session
            mock_db_session.add.assert_not_called()


def test_login_success(app, mock_db_session):
    """Test successful login."""
    with app.test_request_context():
        # Create a mock user with the properties needed
        mock_user = MagicMock()
        mock_user.check_password.return_value = True
        mock_user.is_verified = True
        
        # Mock is_active property
        type(mock_user).is_active = PropertyMock(return_value=True)
        mock_user.id = 1
        mock_user.email = "test@example.com"
        mock_user.role = "tenant"
        mock_user.name = "Test User"
        
        # Mock User.query directly
        with patch('src.controllers.auth_controller.User.query') as mock_user_query:
            mock_user_query.filter_by().first.return_value = mock_user
            
            # Mock check_account_lockout
            with patch('src.controllers.auth_controller.check_account_lockout', return_value={'locked': False}):
                # Mock reset_login_attempts
                with patch('src.controllers.auth_controller.reset_login_attempts'):
                    # Mock create_access_token
                    with patch('src.controllers.auth_controller.create_access_token', return_value="fake_token"):
                        # Call the function with direct parameters
                        result = authenticate_user(
                            email="test@example.com",
                            password="securepassword"
                        )
            
                # Assertions
                assert result[1] == 200
                assert "access_token" in result[0]
                assert result[0]["access_token"] == "fake_token"
                # Direct assertions on the result without depending on the mock
                assert result[0]["user"]["email"] == "test@example.com"
                assert result[0]["user"]["full_name"] == "Test User"