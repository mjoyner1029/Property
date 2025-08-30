"""
Script to test the JWT token generation and validation in a test environment.
"""

import sys
from pathlib import Path
import pytest
import json
import requests

# Ensure project root is importable
parent_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(parent_dir))

from src import create_app
from src.extensions import jwt
from flask_jwt_extended import create_access_token

def get_test_token():
    # Create a test app context
    app = create_app()
    app.config.from_object("src.config.TestingConfig")
    app.config["TESTING"] = True
    
    # Create a token for user ID 2 (landlord)
    with app.app_context():
        token = create_access_token(identity=2)
        print(f"Generated token: {token}")
        
        # Decode the token to show its contents
        import jwt as pyjwt
        decoded = pyjwt.decode(token, options={"verify_signature": False})
        print(f"Decoded token: {json.dumps(decoded, indent=2)}")
        
    return token

def test_token_with_endpoint(token):
    # Start the test Flask server in src/test_token_endpoint.py first
    url = "http://127.0.0.1:5000/api/test/protected"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.json()}")
    except Exception as e:
        print(f"Error making request: {str(e)}")

if __name__ == "__main__":
    token = get_test_token()
    if len(sys.argv) > 1 and sys.argv[1] == "--test-endpoint":
        test_token_with_endpoint(token)
