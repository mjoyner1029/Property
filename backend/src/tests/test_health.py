import json
import pytest
import os
from unittest.mock import patch, MagicMock

def test_health_smoke(client):
    """Test that the basic health endpoint returns 200"""
    res = client.get("/api/health")
    payload = res.get_json() if hasattr(res, "get_json") else json.loads(res.data)
    assert res.status_code == 200
    assert "git_sha" in payload
    assert payload["status"] == "healthy"

def test_health_trailing_slash(client):
    """Test that health endpoint with trailing slash works"""
    res = client.get("/api/health/")
    payload = res.get_json() if hasattr(res, "get_json") else json.loads(res.data)
    assert res.status_code == 200
    assert payload["status"] == "healthy"

def test_healthz(client):
    """Test that healthz endpoint returns 200 and never depends on DB"""
    res = client.get("/healthz")
    payload = res.get_json() if hasattr(res, "get_json") else json.loads(res.data)
    assert res.status_code == 200
    assert payload["status"] == "ok"

def test_readyz_success(client):
    """Test that readyz endpoint returns 200 when DB is available"""
    res = client.get("/readyz")
    payload = res.get_json() if hasattr(res, "get_json") else json.loads(res.data)
    assert res.status_code == 200
    assert payload["status"] == "ready"
    assert payload["db"] == "connected"

def test_readyz_failure(client, app):
    """Test that readyz endpoint returns 503 when DB is unavailable"""
    with patch('sqlalchemy.orm.session.Session.execute') as mock_execute:
        mock_execute.side_effect = Exception("DB connection failed")
        res = client.get("/readyz")
        payload = res.get_json() if hasattr(res, "get_json") else json.loads(res.data)
        assert res.status_code == 503
        assert payload["status"] == "degraded"

def test_debug_sentry_without_dsn(client, monkeypatch):
    """Test debug-sentry endpoint when Sentry DSN is not configured"""
    monkeypatch.delenv("SENTRY_DSN", raising=False)
    
    res = client.get("/debug-sentry")
    payload = res.get_json() if hasattr(res, "get_json") else json.loads(res.data)
    
    # Should return 400 with informative message
    assert res.status_code == 400
    assert payload["status"] == "error"
    assert "Sentry DSN not configured" in payload["message"]
    assert payload["sentry_enabled"] is False

@pytest.mark.skipif(
    not os.environ.get("SENTRY_DSN"), 
    reason="Sentry DSN not configured, skipping test"
)
def test_debug_sentry_with_dsn(client, monkeypatch):
    """Test debug-sentry endpoint when Sentry DSN is configured"""
    with patch('sentry_sdk.capture_exception') as mock_capture_exception:
        # This should raise a ZeroDivisionError which should be captured
        with pytest.raises(ZeroDivisionError):
            client.get("/debug-sentry")
            
        # Verify that capture_exception was called
        mock_capture_exception.assert_called_once()
