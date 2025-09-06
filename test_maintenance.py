#!/usr/bin/env python3
"""
Quick test for admin maintenance endpoint
"""

import requests

def test_admin_maintenance():
    base_url = "http://localhost:5050/api"
    
    # Login as admin
    login_data = {
        "email": "admin@example.com",
        "password": "Password123!"
    }
    
    print("=== Admin Login ===")
    response = requests.post(f"{base_url}/auth/login", json=login_data)
    print(f"Login status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    cookies = response.cookies
    
    print("\n=== Testing /maintenance endpoint ===")
    response = requests.get(f"{base_url}/maintenance", cookies=cookies)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if "authorization_required" in response.text:
        print("🔴 Found authorization_required error!")
    else:
        print("✅ No authorization_required error")

if __name__ == "__main__":
    test_admin_maintenance()
