#!/usr/bin/env python3
"""
Test admin login and dashboard access
"""
import requests
import json

def test_admin_login():
    """Test login with admin credentials"""
    try:
        login_data = {
            "email": "admin@example.com",
            "password": "Password123!"
        }
        response = requests.post('http://localhost:5050/api/auth/login', 
                               json=login_data, 
                               timeout=10)
        print(f"🔐 Admin login status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Admin login successful")
            # Get the cookies from login
            cookies = response.cookies
            
            # Test dashboard access with cookies
            dashboard_response = requests.get('http://localhost:5050/api/dashboard/landlord', 
                                            cookies=cookies, 
                                            timeout=10)
            print(f"📊 Admin dashboard status: {dashboard_response.status_code}")
            
            if dashboard_response.status_code == 200:
                print("✅ Admin dashboard accessible")
                print("📋 Dashboard data:", dashboard_response.json())
            else:
                print(f"❌ Admin dashboard failed: {dashboard_response.text}")
            
            return True
        else:
            try:
                error_data = response.json()
                print(f"❌ Admin login failed: {error_data}")
            except:
                print(f"❌ Admin login failed with status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Admin login request failed: {e}")
        return False

def main():
    print("🧪 Testing Admin Dashboard Access\n")
    test_admin_login()

if __name__ == "__main__":
    main()
