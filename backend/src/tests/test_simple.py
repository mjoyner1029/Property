# backend/src/tests/test_simple.py
"""
Basic smoke tests to ensure the Flask app can start
and the health endpoint responds.
"""

import pytest
from src import create_app


@pytest.fixture(scope="module")
def app():
    app = create_app()
    app.config.from_object("src.config.TestingConfig")
    return app


@pytest.fixture
def client(app):
    return app.test_client()


def test_app_creation(app):
    """App factory should return a Flask app with correct name."""
    assert app.name.startswith("src"), f"Unexpected app name: {app.name}"


def test_health_endpoint(client):
    """Health endpoint should return 200 with expected structure."""
    resp = client.get("/api/health/")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, dict)
    assert "status" in data
    assert data["status"] in ("ok", "healthy")
