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
        print(f"Response content: {response.text}")
    except requests.exceptions.ConnectionError:
        print("Connection error: Make sure your backend server is running")
    except Exception as e:
        print(f"Error: {str(e)}")
        print("If you see a 500 error, that's expected! The endpoint intentionally raises an error.")
    
    print("\nCheck your Sentry dashboard at https://sentry.io for the error event.")
    print("It may take a few moments for the event to appear in Sentry.")

if __name__ == "__main__":
    test_sentry_integration()
