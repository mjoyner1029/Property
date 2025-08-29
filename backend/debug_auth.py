"""Debug script to test auth login functionality."""
import os
import json
import requests

# For local testing
base_url = "http://localhost:5000"  # Adjust if needed for development server

def test_login():
    """Test login with admin credentials."""
    url = f"{base_url}/api/auth/login"
    data = {
        "email": "admin@example.com", 
        "password": "Password123!"
    }
    headers = {
        "Content-Type": "application/json"
    }
    
    print(f"Sending login request to: {url}")
    print(f"Request data: {json.dumps(data)}")
    
    response = requests.post(url, json=data, headers=headers)
    
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        print("Login successful!")
        print(json.dumps(response.json(), indent=2))
    else:
        print("Login failed!")
        print(f"Response content: {response.text}")

if __name__ == "__main__":
    test_login()
