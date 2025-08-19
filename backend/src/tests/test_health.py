"""
Tests for the health check endpoints.
"""

def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get('/api/health')
    assert response.status_code == 200
    assert b'ok' in response.data

def test_health_check_db(client):
    """Test the health check with DB connection."""
    response = client.get('/api/health/db')
    assert response.status_code == 200
    assert b'ok' in response.data
    assert b'database' in response.data

def test_health_check_git_sha(client):
    """Test the health check with Git SHA."""
    response = client.get('/api/health/git')
    assert response.status_code == 200
    assert b'ok' in response.data
    assert b'git_sha' in response.data
