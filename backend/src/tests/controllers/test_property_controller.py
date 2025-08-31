"""
Tests for the property controller
"""
import json
import pytest
from unittest.mock import patch, MagicMock

from src.controllers.property_controller import get_properties, get_property, create_property, update_property, delete_property


@pytest.fixture
def mock_db_session():
    """Mock database session."""
    session = MagicMock()
    return session


def test_get_properties(app, mock_db_session):
    """Test getting all properties."""
    with app.test_request_context():
        with patch('src.controllers.property_controller.db.session', mock_db_session):
            with patch('src.controllers.property_controller.verify_jwt_in_request'):
                with patch('src.controllers.property_controller.get_jwt_identity', return_value=1):
                        # Create proper mock properties with to_dict method that returns actual dict
                        mock_prop1 = MagicMock()
                        mock_prop1.to_dict.return_value = {"id": 1, "name": "Property 1"}
                        mock_prop2 = MagicMock()
                        mock_prop2.to_dict.return_value = {"id": 2, "name": "Property 2"}
                        
                        mock_properties = [mock_prop1, mock_prop2]
                        
                        # Mock for get user
                        mock_user = MagicMock()
                        mock_user.role = "admin"
                        mock_db_session.get.return_value = mock_user
                        
                        # Setup the query chain mock for Property.query
                        mock_query = MagicMock()
                        mock_db_session.query.return_value = mock_query
                        mock_query.all.return_value = mock_properties
                        
                        # Also mock Property.query directly
                        property_query_patch = patch('src.controllers.property_controller.Property.query')
                        mock_property_query = property_query_patch.start()
                        mock_property_query.all.return_value = mock_properties
                        mock_property_query.filter.return_value = mock_property_query
                        mock_property_query.filter_by.return_value = mock_property_query

                        result = get_properties()
                        
                        property_query_patch.stop()
                        
                        assert result[0] == {
                            "properties": [{"id": 1, "name": "Property 1"}, {"id": 2, "name": "Property 2"}]
                        }
                        assert result[1] == 200


def test_get_property_exists(app, mock_db_session):
    """Test getting a property that exists."""
    with app.test_request_context():
        with patch('src.controllers.property_controller.db.session', mock_db_session):
            with patch('src.controllers.property_controller.verify_jwt_in_request'):
                with patch('src.controllers.property_controller.get_jwt_identity', return_value=1):
                    # Set up the property mock with a proper to_dict method
                    mock_property = MagicMock()
                    mock_property.to_dict.return_value = {"id": 1, "name": "Property 1"}
                    mock_property.landlord_id = 1
                    
                    # Set up the user mock
                    mock_user = MagicMock()
                    mock_user.role = "admin"
                    
                    # Configure the session mocks with side_effect to return different values
                    # for each db.session.get() call (first for property, then for user)
                    mock_db_session.get.side_effect = [mock_property, mock_user]
                    
                    # Also mock Property.query directly
                    property_query_patch = patch('src.controllers.property_controller.Property.query')
                    mock_property_query = property_query_patch.start()
                    
                    # Call the function we're testing
                    result = get_property(1)
                    
                    property_query_patch.stop()
                    
                    assert result[0] == {
                        "property": {"id": 1, "name": "Property 1"}
                    }
                    assert result[1] == 200


def test_get_property_not_exists(app, mock_db_session):
    """Test getting a property that doesn't exist."""
    with app.test_request_context():
        with patch('src.controllers.property_controller.db.session', mock_db_session):
            with patch('src.controllers.property_controller.verify_jwt_in_request'):
                with patch('src.controllers.property_controller.get_jwt_identity', return_value=1):
                    # Mock the database session to return None for the property
                    mock_db_session.get.return_value = None
                    
                    # Also mock Property.query directly
                    property_query_patch = patch('src.controllers.property_controller.Property.query')
                    mock_property_query = property_query_patch.start()
                    
                    # Call the function we're testing
                    result = get_property(999)
                    
                    property_query_patch.stop()
                    
                    assert result[0] == {
                        "error": "Property not found"
                    }
                    assert result[1] == 404
                    assert result[1] == 404
