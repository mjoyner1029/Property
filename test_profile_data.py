#!/usr/bin/env python3

import requests
import json

def test_profile_data_flow():
    print("🧪 Testing Profile Data Flow")
    print("=" * 50)
    
    # Check backend health
    try:
        response = requests.get("http://localhost:5050/api/health", timeout=5)
        print(f"✅ Backend health: {response.status_code}")
    except Exception as e:
        print(f"❌ Backend not reachable: {e}")
        return
    
    # Test admin login
    try:
        login_data = {
            "email": "admin@example.com",
            "password": "Password123!"
        }
        response = requests.post(
            "http://localhost:5050/api/auth/login", 
            json=login_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data.get('user', {})
            print(f"✅ Login successful")
            print(f"   User ID: {user.get('id')}")
            print(f"   Name: {user.get('name')}")
            print(f"   Email: {user.get('email')}")
            print(f"   Role: {user.get('role')}")
            
            # Test the data structure that frontend expects
            print(f"\n📊 Frontend Profile Data Analysis:")
            print(f"   Raw name field: '{user.get('name', '')}'")
            print(f"   Raw email field: '{user.get('email', '')}'")
            print(f"   Has full_name: {'full_name' in user}")
            
            # Simulate the normalizeUser function
            full_name = (
                user.get('full_name') or 
                user.get('name') or 
                ""
            )
            print(f"   Normalized full_name: '{full_name}'")
            
            if full_name and user.get('email'):
                print("✅ Profile data is available and should populate frontend")
            else:
                print("❌ Profile data is missing required fields")
                
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Login test failed: {e}")
    
    # Check frontend availability
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        print(f"\n🌐 Frontend status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Frontend is running")
        else:
            print(f"❌ Frontend not accessible: {response.status_code}")
    except Exception as e:
        print(f"❌ Frontend not reachable: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Profile Data Flow Test Complete")

if __name__ == "__main__":
    test_profile_data_flow()
