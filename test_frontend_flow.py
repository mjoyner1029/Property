#!/usr/bin/env python3
"""
Test frontend authentication flow exactly as a browser would
"""

import requests
import json

def test_frontend_admin_flow():
    """Test the exact flow a frontend user would experience"""
    
    # Frontend API calls use the frontend's API client
    frontend_base = "http://localhost:3000"
    api_base = "http://localhost:5050/api"
    
    print("=== Testing frontend admin authentication flow ===")
    
    # Step 1: Login as admin (like the frontend would)
    login_data = {
        "email": "admin@example.com", 
        "password": "Password123!"
    }
    
    session = requests.Session()
    session.headers.update({
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/'
    })
    
    print("1. Admin Login...")
    login_response = session.post(f"{api_base}/auth/login", json=login_data)
    print(f"Login Status: {login_response.status_code}")
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return
    
    print(f"Login successful: {login_response.json()}")
    
    # Step 2: Now make the same API calls the Dashboard context providers make
    print("\n2. Testing context provider calls...")
    
    # MaintenanceContext.fetchRequests() -> /maintenance
    print("\nTesting maintenance requests...")
    maint_response = session.get(f"{api_base}/maintenance")
    print(f"Maintenance Status: {maint_response.status_code}")
    if maint_response.status_code != 200:
        print(f"Maintenance Error: {maint_response.text}")
        if "authorization_required" in maint_response.text:
            print("🔴 FOUND authorization_required in maintenance!")
    else:
        print(f"✅ Maintenance OK: {maint_response.json()}")
    
    # PaymentContext.fetchPayments() -> /payments
    print("\nTesting payment requests...")
    payment_response = session.get(f"{api_base}/payments")
    print(f"Payment Status: {payment_response.status_code}")
    if payment_response.status_code != 200:
        print(f"Payment Error: {payment_response.text}")
        if "authorization_required" in payment_response.text:
            print("🔴 FOUND authorization_required in payments!")
    else:
        print(f"✅ Payment OK: {payment_response.json()}")
    
    # Step 3: Also test any dashboard-specific endpoints
    print("\nTesting dashboard endpoints...")
    
    # Check if the frontend might be calling a dashboard endpoint directly
    dashboard_endpoints = [
        "/dashboard/stats",
        "/dashboard/landlord", 
        "/dashboard/tenant"
    ]
    
    for endpoint in dashboard_endpoints:
        print(f"\nTesting {endpoint}...")
        dash_response = session.get(f"{api_base}{endpoint}")
        print(f"Status: {dash_response.status_code}")
        if dash_response.status_code != 200:
            print(f"Error: {dash_response.text}")
            if "authorization_required" in dash_response.text:
                print(f"🔴 FOUND authorization_required in {endpoint}!")
                return endpoint
        else:
            print(f"✅ OK: {len(dash_response.text)} chars")
    
    print("\n✅ All API calls successful")
    return None

if __name__ == "__main__":
    failing_endpoint = test_frontend_admin_flow()
    if failing_endpoint:
        print(f"\n🎯 The failing endpoint is: {failing_endpoint}")
    else:
        print("\n🤔 No authorization_required found via API")
        print("The error might be specific to the frontend context or error handling.")
