#!/usr/bin/env python3

import requests
import json
from urllib.parse import urljoin

BASE_URL = "http://localhost:3000"
API_URL = "http://localhost:5050"

def test_admin_login():
    """Test admin login and frontend access"""
    print("=== Testing Admin Frontend Access ===")
    
    # Create a session to maintain cookies
    session = requests.Session()
    
    # Login to get cookies
    login_data = {
        "email": "admin@example.com",
        "password": "Password123!"
    }
    
    print("1. Logging in as admin...")
    response = session.post(f"{API_URL}/api/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return False
    
    print("✅ Admin login successful")
    
    # Test frontend pages
    pages_to_test = [
        "/",  # Dashboard
        "/admin/overview",  # Admin Overview
        "/admin/properties",  # Admin Properties
        "/admin/tenants",  # Admin Tenants
        "/admin/users",  # User Management
    ]
    
    print("\n2. Testing frontend page access...")
    for page in pages_to_test:
        try:
            response = session.get(f"{BASE_URL}{page}")
            if response.status_code == 200:
                print(f"✅ {page} - accessible")
            else:
                print(f"❌ {page} - status {response.status_code}")
        except Exception as e:
            print(f"❌ {page} - error: {str(e)}")
    
    print("\n3. Testing API endpoints with admin session...")
    
    # Test API endpoints that the frontend components use
    api_endpoints = [
        "/api/admin/properties",
        "/api/admin/tenants", 
        "/api/admin/users",
        "/api/admin/stats"
    ]
    
    for endpoint in api_endpoints:
        try:
            response = session.get(f"{API_URL}{endpoint}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {endpoint} - returns data: {type(data).__name__}")
            else:
                print(f"❌ {endpoint} - status {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint} - error: {str(e)}")
    
    return True

def main():
    print("Testing Admin Portal Access")
    print("=" * 40)
    
    success = test_admin_login()
    
    if success:
        print("\n🎉 All admin portal tests completed!")
        print("\nNext steps:")
        print("1. Open http://localhost:3000 in your browser")
        print("2. Login with admin@example.com / Password123!")
        print("3. Navigate to 'All Properties' and 'All Tenants' in the admin menu")
    else:
        print("\n❌ Some tests failed")

if __name__ == "__main__":
    main()
