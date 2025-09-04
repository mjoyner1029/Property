#!/usr/bin/env python
"""
Simple script to test Sentry integration.
Run this script to trigger a test error that will be sent to Sentry.
"""
import sys
import os
import requests

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

def test_sentry_integration():
    """
    Send a request to the debug-sentry endpoint to trigger a test error.
    """
    print("Testing Sentry integration...")
    
    # Default to localhost:5050
    base_url = os.environ.get("API_URL", "http://localhost:5050")
    
    try:
        response = requests.get(f"{base_url}/debug-sentry", timeout=5)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 400:
            # Parse the JSON response
            try:
                data = response.json()
                print(f"Message: {data.get('message', 'No message')}")
                print(f"Sentry enabled: {data.get('sentry_enabled', 'Unknown')}")
                print("\nSentry DSN is not configured. Please set the SENTRY_DSN environment variable.")
                return
            except:
                print(f"Response content: {response.text}")
        else:
            print(f"Response content: {response.text}")
            print("If you see a 500 error, that's expected! The endpoint intentionally raises an error.")
            print("\nCheck your Sentry dashboard at https://sentry.io for the error event.")
            print("It may take a few moments for the event to appear in Sentry.")
            
    except requests.exceptions.ConnectionError:
        print("Connection error: Make sure your backend server is running")
    except Exception as e:
        print(f"Error: {str(e)}")
        if "500" in str(e):
            print("This 500 error is expected! The endpoint intentionally raises an error to test Sentry.")
            print("\nCheck your Sentry dashboard at https://sentry.io for the error event.")
            print("It may take a few moments for the event to appear in Sentry.")

if __name__ == "__main__":
    test_sentry_integration()
