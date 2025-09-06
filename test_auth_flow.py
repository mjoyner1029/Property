#!/usr/bin/env python3

import requests
import json
import time

def test_auth_flow():
    print("🔍 Testing Auth Flow for Profile Page")
    print("=" * 50)
    
    session = requests.Session()
    
    # Step 1: Login
    print("1️⃣ Testing login...")
    login_data = {
        "email": "admin@example.com",
        "password": "Password123!"
    }
    
    response = session.post(
        "http://localhost:5050/api/auth/login", 
        json=login_data,
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        user = data.get('user', {})
        token = data.get('access_token')
        print(f"✅ Login successful")
        print(f"   Access token: {token[:20]}..." if token else "   No access token")
        print(f"   User data: {json.dumps(user, indent=2)}")
        
        # Test if cookies are set
        print(f"   Cookies: {dict(session.cookies)}")
        
        # Step 2: Test auth/me endpoint which frontend should call
        print("\n2️⃣ Testing /auth/me endpoint...")
        me_response = session.get("http://localhost:5050/api/auth/me", timeout=10)
        
        if me_response.status_code == 200:
            me_data = me_response.json()
            print(f"✅ /auth/me successful")
            print(f"   Response: {json.dumps(me_data, indent=2)}")
        else:
            print(f"❌ /auth/me failed: {me_response.status_code} - {me_response.text}")
        
        # Step 3: Test refresh endpoint
        print("\n3️⃣ Testing /auth/refresh endpoint...")
        refresh_response = session.post("http://localhost:5050/api/auth/refresh", timeout=10)
        
        if refresh_response.status_code == 200:
            refresh_data = refresh_response.json()
            print(f"✅ /auth/refresh successful")
            print(f"   Has new token: {'access_token' in refresh_data}")
            print(f"   Has user data: {'user' in refresh_data}")
        else:
            print(f"❌ /auth/refresh failed: {refresh_response.status_code} - {refresh_response.text}")
        
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
    
    print("\n" + "=" * 50)
    print("🏁 Auth Flow Test Complete")

if __name__ == "__main__":
    test_auth_flow()
