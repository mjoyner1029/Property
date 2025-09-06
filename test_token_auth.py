#!/usr/bin/env python3
"""
Test frontend authentication with Authorization header like the frontend API client does
"""

import requests
import json

def test_admin_with_token_auth():
    """Test using Authorization header like frontend API client"""
    
    api_base = "http://localhost:5050/api"
    
    print("=== Testing admin with token-based auth (like frontend) ===")
    
    # Step 1: Login and get access token
    login_data = {
        "email": "admin@example.com", 
        "password": "Password123!"
    }
    
    print("1. Admin Login...")
    login_response = requests.post(f"{api_base}/auth/login", json=login_data)
    print(f"Login Status: {login_response.status_code}")
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return
    
    login_data = login_response.json()
    access_token = login_data.get('access_token')
    
    if not access_token:
        print("❌ No access token received")
        return
    
    print(f"✅ Access token received: {access_token[:50]}...")
    
    # Step 2: Use Authorization header for API calls (like frontend does)
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    print("\n2. Testing with Authorization header...")
    
    # Test the exact same endpoints the frontend context providers call
    endpoints_to_test = [
        "/maintenance",
        "/payments"
    ]
    
    for endpoint in endpoints_to_test:
        print(f"\nTesting {endpoint}...")
        response = requests.get(f"{api_base}{endpoint}", headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Error: {response.text}")
            if "authorization_required" in response.text:
                print(f"🔴 FOUND authorization_required in {endpoint}!")
                return endpoint
        else:
            print(f"✅ Success: {len(response.text)} chars")
    
    print("\n3. Testing scenario where token might be missing...")
    
    # Test what happens if Authorization header is missing (race condition simulation)
    print("\nTesting without Authorization header...")
    response = requests.get(f"{api_base}/maintenance")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if "authorization_required" in response.text:
        print("🔴 CONFIRMED: Missing Authorization header causes authorization_required!")
        return "missing_auth_header"
    
    print("\n✅ All tests passed")
    return None

if __name__ == "__main__":
    failing_case = test_admin_with_token_auth()
    if failing_case:
        print(f"\n🎯 Found the issue: {failing_case}")
        if failing_case == "missing_auth_header":
            print("💡 Solution: The frontend API client is not sending Authorization headers")
            print("   This suggests a race condition where API calls happen before token is set")
    else:
        print("\n✅ No issues found with token-based auth")
