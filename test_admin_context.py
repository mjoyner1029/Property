#!/usr/bin/env python3
"""
Test admin dashboard context provider calls to identify authorization_required error
"""

import requests
import json
import sys

def test_admin_context_calls():
    base_url = "http://localhost:5050/api"
    
    # First login as admin
    login_data = {
        "email": "admin@example.com",
        "password": "Password123!"
    }
    
    print("=== Admin Login ===")
    response = requests.post(f"{base_url}/auth/login", json=login_data)
    print(f"Login status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return False
    
    # Extract cookies
    cookies = response.cookies
    print(f"Login cookies: {dict(cookies)}")
    
    # Test endpoints that the Dashboard context providers call
    endpoints_to_test = [
        "/payments",
        "/payments/tenant",
        "/payments/landlord", 
        "/maintenance",
        "/properties",
        "/dashboard/stats"
    ]
    
    print("\n=== Testing Context Provider Endpoints ===")
    for endpoint in endpoints_to_test:
        print(f"\nTesting: {endpoint}")
        try:
            response = requests.get(f"{base_url}{endpoint}", cookies=cookies)
            print(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"Error response: {response.text}")
                
                # Check if this contains "authorization_required"
                if "authorization_required" in response.text:
                    print(f"🔴 FOUND IT! {endpoint} returns authorization_required")
                    return endpoint
            else:
                print(f"✅ Success: {len(response.text)} chars")
                
        except Exception as e:
            print(f"Request failed: {e}")
    
    return None

if __name__ == "__main__":
    print("Testing admin dashboard context provider calls...")
    failing_endpoint = test_admin_context_calls()
    
    if failing_endpoint:
        print(f"\n🎯 Found the failing endpoint: {failing_endpoint}")
        sys.exit(1)
    else:
        print("\n✅ All endpoints work for admin user")
        sys.exit(0)
