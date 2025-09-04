"""
Simple test script to directly test the health endpoint functionality.
"""
import os
import sys
from src.app import create_app

def test_health_endpoint():
    """Test the health endpoint directly."""
    # Create app with test config
    app = create_app('test')
    
    # Create a test client
    with app.test_client() as client:
        # Make a request to the health endpoint
        response = client.get('/api/health/')
        data = response.get_json()
        
        # Check the response
        print("Status Code:", response.status_code)
        print("Response:", data)
        
        # Check if the response is as expected
        assert response.status_code == 200
        assert data['status'] == 'healthy'
        
        print("Health endpoint test passed!")

if __name__ == '__main__':
    # Make sure we're in the backend directory
    if not os.path.exists('src/app.py'):
        print("Error: This script must be run from the backend directory.")
        sys.exit(1)
        
    test_health_endpoint()
