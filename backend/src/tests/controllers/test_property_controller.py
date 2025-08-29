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
            mock_properties = [
                MagicMock(id=1, to_dict=lambda: {"id": 1, "name": "Property 1"}),
                MagicMock(id=2, to_dict=lambda: {"id": 2, "name": "Property 2"})
            ]
            mock_db_session.query().all.return_value = mock_properties
            
            result = get_properties()
            
            assert result[0] == {
                "success": True,
                "data": [{"id": 1, "name": "Property 1"}, {"id": 2, "name": "Property 2"}]
            }
            assert result[1] == 200


def test_get_property_exists(app, mock_db_session):
    """Test getting a property that exists."""
    with app.test_request_context():
        with patch('src.controllers.property_controller.db.session', mock_db_session):
            mock_property = MagicMock(id=1, to_dict=lambda: {"id": 1, "name": "Property 1"})
            mock_db_session.query().filter().first.return_value = mock_property
            
            result = get_property(1)
            
            assert result[0] == {
                "success": True,
                "data": {"id": 1, "name": "Property 1"}
            }
            assert result[1] == 200


def test_get_property_not_exists(app, mock_db_session):
    """Test getting a property that doesn't exist."""
    with app.test_request_context():
        with patch('src.controllers.property_controller.db.session', mock_db_session):
            mock_db_session.query().filter().first.return_value = None
            
            result = get_property(999)
            
            assert result[0] == {
                "success": False,
                "message": "Property not found"
            }
            assert result[1] == 404
