import pytest
import time
import json

def test_rate_limiting(client):
    """Test that rate limiting correctly returns 429 status when limit is exceeded"""
    # Use a non-authenticated endpoint with rate limiting
    url = "/api/auth/login"
    
    # Test payload (will fail login but that's ok for this test)
    payload = {
        "email": "test@example.com",
        "password": "wrong_password"
    }
    
    # Send requests rapidly to trigger rate limiting
    responses = []
    for i in range(15):  # Assuming limit is set to 10 per minute
        response = client.post(url, json=payload)
        responses.append(response.status_code)
        time.sleep(0.05)  # Small delay to avoid overwhelming the test
    
    # Check that at least one request received a 429 Too Many Requests
    assert 429 in responses, "Rate limiting did not trigger 429 status code"
    
    # Calculate rate limiting percentage
    total_requests = len(responses)
    limited_requests = responses.count(429)
    
    print(f"Rate limiting triggered on {limited_requests}/{total_requests} requests")
    
    # Verify that we still got some successful responses before hitting the limit
    successful_responses = sum(1 for status in responses if status in [200, 401])
    assert successful_responses > 0, "No successful responses before rate limiting"
