#!/usr/bin/env python3
"""
Test script to validate frontend-backend connectivity
"""
import requests
import json
import subprocess
import sys
import time

def check_backend_health():
    """Check if backend is running and healthy"""
    try:
        response = requests.get('http://localhost:5050/api/health', timeout=5)
        if response.status_code == 200:
            print("✅ Backend health check passed")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_dashboard_endpoint():
    """Test if dashboard endpoint responds (should require auth)"""
    try:
        # Test tenant dashboard endpoint
        response = requests.get('http://localhost:5050/api/dashboard/tenant', timeout=5)
        print(f"📊 Dashboard endpoint status: {response.status_code}")
        return response.status_code == 401  # Should require authentication
    except requests.exceptions.RequestException as e:
        print(f"📊 Dashboard endpoint status: Connection failed")
        return False

def check_frontend():
    """Check if frontend is running"""
    try:
        response = requests.get('http://localhost:3000', timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is running")
            return True
        else:
            print(f"❌ Frontend check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend connection failed: {e}")
        return False

def test_login():
    """Test login with test credentials"""
    try:
        login_data = {
            "email": "tenant@example.com",
            "password": "Password123!"
        }
        response = requests.post('http://localhost:5050/api/auth/login', 
                               json=login_data, timeout=5)
        print(f"🔐 Login test status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Login successful")
            return response.json()
        else:
            print(f"❌ Login failed: {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Login endpoint failed: {e}")
        return None

def main():
    print("🧪 Testing Frontend-Backend Connectivity\n")
    
    # Check services
    backend_ok = check_backend_health()
    frontend_ok = check_frontend()
    auth_ok = check_auth_endpoint()
    
    if backend_ok:
        login_result = test_login()
    
    print("\n📋 Summary:")
    print(f"Backend Health: {'✅' if backend_ok else '❌'}")
    print(f"Frontend Running: {'✅' if frontend_ok else '❌'}")
    print(f"Auth Protection: {'✅' if auth_ok else '❌'}")
    
    if not backend_ok:
        print("\n🔧 Backend is not running. Start it with:")
        print("cd /Users/mjoyner/Property/backend && python wsgi.py")
    
    if not frontend_ok:
        print("\n🔧 Frontend is not running. Start it with:")
        print("cd /Users/mjoyner/Property/frontend && npm start")

if __name__ == "__main__":
    main()
