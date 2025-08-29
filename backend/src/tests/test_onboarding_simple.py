import pytest
import json

def test_onboard_start_api(client):
    """Test that the onboard/start API exists"""
    response = client.post('/api/onboard/start')
    
    # We just want to make sure it doesn't return a 404
    assert response.status_code != 404
    
    if response.status_code == 401:  # This is expected for unauthenticated requests
        assert "token" in response.get_data(as_text=True).lower() or "unauthorized" in response.get_data(as_text=True).lower()
        
def test_onboard_step_api(client):
    """Test that the onboard/step API exists"""
    response = client.put('/api/onboard/step/profile')
    
    # We just want to make sure it doesn't return a 404
    assert response.status_code != 404
    
    if response.status_code == 401:  # This is expected for unauthenticated requests
        assert "token" in response.get_data(as_text=True).lower() or "unauthorized" in response.get_data(as_text=True).lower()
