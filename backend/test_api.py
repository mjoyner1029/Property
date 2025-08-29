"""
API endpoints test file.
"""
import pytest
from flask import json

from src.app import create_app


@pytest.fixture(scope="module")
def app():
    """Fixture for creating the Flask app."""
    app = create_app()
    return app


@pytest.fixture
def client(app):
    """Test client for the Flask app."""
    return app.test_client()


def test_root(client):
    """Test the root endpoint."""
    response = client.get('/')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'name' in data
    assert 'status' in data
    assert data['status'] == 'online'
    assert 'api_base_url' in data
    assert 'health_check' in data


def test_health_endpoint(client):
    """Test the health endpoint."""
    response = client.get('/api/health/')  # Flask routes with trailing slash
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'


def test_status_endpoint(client):
    """Test the status endpoint."""
    response = client.get('/api/status')  # Match the actual route without trailing slash
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'online'
