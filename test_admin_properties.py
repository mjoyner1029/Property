#!/usr/bin/env python3
"""
Test admin properties endpoint to check response structure
"""

import requests
import json

def test_admin_properties():
    api_base = "http://localhost:5050/api"
    
    # Login as admin
    login_data = {
        "email": "admin@example.com", 
        "password": "Password123!"
    }
    
    print("=== Testing admin properties endpoint ===")
    
    session = requests.Session()
    
    print("1. Admin Login...")
    login_response = session.post(f"{api_base}/auth/login", json=login_data)
    print(f"Login Status: {login_response.status_code}")
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return
    
    print("2. Testing /properties endpoint...")
    props_response = session.get(f"{api_base}/properties")
    print(f"Properties Status: {props_response.status_code}")
    
    if props_response.status_code == 200:
        data = props_response.json()
        print(f"Response structure: {type(data)}")
        print(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        
        if isinstance(data, dict) and 'properties' in data:
            properties = data['properties']
            print(f"Properties type: {type(properties)}")
            print(f"Properties length: {len(properties) if isinstance(properties, list) else 'Not a list'}")
        else:
            print(f"Data is: {data}")
    else:
        print(f"Error: {props_response.text}")

if __name__ == "__main__":
    test_admin_properties()
