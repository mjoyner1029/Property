import pytest
import json

def test_index_route(client):
    """Test the root/index route"""
    response = client.get('/')
    assert response.status_code == 200
    # If your index returns JSON:
    # data = json.loads(response.data)
    # assert 'message' in data


def test_api_status(client):
    """Test the API status endpoint"""
    response = client.get('/api/status')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'status' in data
    assert data['status'] == 'online'