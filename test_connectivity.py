#!/usr/bin/env python3
"""
Test connectivity between frontend and backend
"""
import requests
import json

def test_backend_health():
    """Test if backend health endpoint is responding"""
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

def test_frontend():
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

def test_login():
    """Test login with test credentials"""
    try:
        login_data = {
            "email": "tenant@example.com",
            "password": "Password123!"
        }
        response = requests.post('http://localhost:5050/api/auth/login', 
                               json=login_data, 
                               timeout=10)
        print(f"🔐 Login test status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Login successful")
            return True
        else:
            try:
                error_data = response.json()
                print(f"❌ Login failed: {error_data}")
            except:
                print(f"❌ Login failed with status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Login request failed: {e}")
        return False

def main():
    """Run all connectivity tests"""
    print("🧪 Testing Frontend-Backend Connectivity\n")
    
    # Test backend health
    backend_ok = test_backend_health()
    
    # Test frontend
    frontend_ok = test_frontend()
    
    # Test dashboard endpoint (should require auth)
    dashboard_ok = test_dashboard_endpoint()
    
    # Test login
    login_ok = test_login()
    
    print("\n📋 Summary:")
    print(f"Backend Health: {'✅' if backend_ok else '❌'}")
    print(f"Frontend Running: {'✅' if frontend_ok else '❌'}")
    print(f"Dashboard Auth: {'✅' if dashboard_ok else '❌'}")
    print(f"Login Working: {'✅' if login_ok else '❌'}")
    
    if backend_ok and frontend_ok and dashboard_ok and login_ok:
        print("\n🎉 All tests passed! Both services are running correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the logs above for details.")
    
    return all([backend_ok, frontend_ok, dashboard_ok, login_ok])

if __name__ == "__main__":
    main()
