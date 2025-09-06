#!/usr/bin/env python3
"""
Test exactly what the frontend Dashboard.jsx does for admin users
"""

import requests

def test_admin_dashboard_api():
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
    
    # Now simulate what Dashboard.jsx does on page load
    # It calls fetchRequests() and fetchPayments() from context providers
    
    print("\n=== Simulating Dashboard Context Provider Calls ===")
    
    # MaintenanceContext.fetchRequests() for admin would call /maintenance
    print("\n1. MaintenanceContext.fetchRequests() -> /maintenance")
    response = requests.get(f"{base_url}/maintenance", cookies=cookies)
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Error: {response.text}")
        if "authorization_required" in response.text.lower():
            print("🔴 FOUND authorization_required in maintenance!")
            return "maintenance"
    
    # PaymentContext.fetchPayments() for admin would call /payments
    print("\n2. PaymentContext.fetchPayments() -> /payments")
    response = requests.get(f"{base_url}/payments", cookies=cookies)
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Error: {response.text}")
        if "authorization_required" in response.text.lower():
            print("🔴 FOUND authorization_required in payments!")
            return "payments"
    
    # Check if there are any other API calls that might be triggered
    # Look for dashboard-specific calls
    print("\n3. Check if Dashboard component makes any direct API calls")
    
    # The Dashboard component might call dashboard endpoints directly
    response = requests.get(f"{base_url}/dashboard/landlord", cookies=cookies)
    print(f"/dashboard/landlord Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Error: {response.text}")
        if "authorization_required" in response.text.lower():
            print("🔴 FOUND authorization_required in dashboard/landlord!")
            return "dashboard/landlord"
    
    print("\n✅ All API calls successful, no authorization_required found")
    return None

if __name__ == "__main__":
    failing_endpoint = test_admin_dashboard_api()
    if failing_endpoint:
        print(f"\n🎯 The failing endpoint is: {failing_endpoint}")
    else:
        print("\n🤔 No authorization_required error found in API calls")
        print("The error might be coming from the frontend itself or a different source")
