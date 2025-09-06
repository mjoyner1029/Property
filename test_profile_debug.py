#!/usr/bin/env python3

import requests
import json

# Test profile page debugging
print("🔍 Testing Profile Page Issues")
print("=" * 50)

# Check if backend is running
try:
    response = requests.get("http://localhost:5050/api/health", timeout=5)
    print(f"✅ Backend health: {response.status_code}")
    print(f"   Response: {response.text}")
except requests.exceptions.RequestException as e:
    print(f"❌ Backend not reachable: {e}")
    exit(1)

# Test admin login to get user data
print("\n📝 Testing admin login...")
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
    print(f"Login response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login successful")
        print(f"   User data: {json.dumps(data.get('user', {}), indent=2)}")
        
        # Extract cookies for further requests
        cookies = response.cookies
        headers = {}
        if 'access_token' in data:
            headers['Authorization'] = f"Bearer {data['access_token']}"
        
        # Test /me endpoint
        print("\n🔍 Testing /me endpoint...")
        me_response = requests.get(
            "http://localhost:5050/api/auth/me",
            cookies=cookies,
            headers=headers,
            timeout=10
        )
        print(f"/me response status: {me_response.status_code}")
        if me_response.status_code == 200:
            me_data = me_response.json()
            print(f"✅ /me endpoint working")
            print(f"   User data: {json.dumps(me_data, indent=2)}")
        else:
            print(f"❌ /me endpoint failed: {me_response.text}")
            
    else:
        print(f"❌ Login failed: {response.text}")
        
except requests.exceptions.RequestException as e:
    print(f"❌ Login request failed: {e}")

print("\n" + "=" * 50)
print("🏁 Profile Debug Test Complete")
