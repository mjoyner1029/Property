"""
Smoke tests for the backend application.
"""
import pytest
from flask import url_for


def test_healthz_returns_ok(client):
    """Test that the health check endpoint returns 200 OK."""
    response = client.get('/health')  # The actual endpoint is /health not /healthz
    assert response.status_code == 200
    assert "status" in response.json  # Check that it contains a status field


def test_docs_blueprint_registered(client):
    """Test that the docs blueprint is registered."""
    # Try to access the documentation endpoint directly
    # This will fail if the docs blueprint is not registered
    response = client.get('/api/docs')
    
    # Check that the endpoint returns a 200 OK status code
    assert response.status_code == 200
    
    # Should be JSON response
    assert response.content_type == 'application/json'
