#!/usr/bin/env python3

import requests
import json

BASE_URL = "http://localhost:5050"

def login_admin():
    """Login as admin and get token"""
    login_data = {
        "email": "admin@example.com",
        "password": "Password123!"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if response.status_code == 200:
        # Extract token from cookie
        cookies = response.cookies
        return cookies
    else:
        print(f"Failed to login: {response.status_code} - {response.text}")
        return None

def test_admin_properties(cookies):
    """Test admin properties endpoint"""
    print("\n=== Testing Admin Properties Endpoint ===")
    response = requests.get(f"{BASE_URL}/api/admin/properties", cookies=cookies)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Properties count: {len(data.get('properties', []))}")
        print(f"Total: {data.get('total', 0)}")
        if data.get('properties'):
            print("Sample property structure:")
            print(json.dumps(data['properties'][0], indent=2))
    else:
        print(f"Error: {response.text}")

def test_admin_tenants(cookies):
    """Test admin tenants endpoint"""
    print("\n=== Testing Admin Tenants Endpoint ===")
    response = requests.get(f"{BASE_URL}/api/admin/tenants", cookies=cookies)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Tenants count: {len(data.get('tenants', []))}")
        print(f"Total: {data.get('total', 0)}")
        if data.get('tenants'):
            print("Sample tenant structure:")
            print(json.dumps(data['tenants'][0], indent=2))
    else:
        print(f"Error: {response.text}")

def main():
    print("Testing Admin Endpoints...")
    
    # Login as admin
    cookies = login_admin()
    if not cookies:
        print("Failed to login as admin")
        return
    
    print("✓ Admin login successful")
    
    # Test endpoints
    test_admin_properties(cookies)
    test_admin_tenants(cookies)
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    main()
