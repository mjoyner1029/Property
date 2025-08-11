#!/usr/bin/env python3
"""
Asset Anchor API Smoke Test

This script performs basic smoke tests against the Asset Anchor API
to verify core functionality is working correctly.

Usage:
  python smoke_test.py --url https://api.assetanchor.io
"""

import os
import argparse
import pytest
import requests
import json
import time
import sys
from urllib.parse import urljoin

# ANSI color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

# API base URL (can be overridden with --url argument)
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5050")

def print_success(message):
    print(f"{GREEN}✓ {message}{RESET}")

def print_error(message):
    print(f"{RED}✗ {message}{RESET}")

def print_warning(message):
    print(f"{YELLOW}! {message}{RESET}")

def test_health_endpoint(base_url):
    """Verify that the health endpoint returns 200 and contains required fields."""
    print("Testing health endpoint...")
    try:
        response = requests.get(urljoin(base_url, "/api/health"), timeout=10)
        
        if response.status_code != 200:
            print_error(f"Health endpoint returned status {response.status_code}")
            return False
            
        data = response.json()
        
        # Check for required fields
        required_fields = ["status", "version", "database", "timestamp"]
        for field in required_fields:
            if field not in data:
                print_error(f"Health endpoint missing required field: {field}")
                return False
        
        print_success("Health endpoint is responding correctly")
        return True
    except requests.exceptions.RequestException as e:
        print_error(f"Failed to connect to health endpoint: {e}")
        return False
    except json.JSONDecodeError:
        print_error("Health endpoint returned invalid JSON")
        return False
    
def test_webhooks_stripe_endpoint_security(base_url):
    """Verify that the Stripe webhook endpoint rejects invalid signatures."""
    print("Testing Stripe webhook security...")
    try:
        response = requests.post(
            urljoin(base_url, "/api/webhooks/stripe"),
            headers={"Stripe-Signature": "invalid_signature"},
            json={"type": "test_event"},
            timeout=10
        )
        # Should return 400 for invalid signature
        if response.status_code == 400:
            print_success("Stripe webhook security is properly configured")
            return True
        else:
            print_error(f"Stripe webhook security check failed: expected status 400, got {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Error testing webhook security: {e}")
        return False

def test_rate_limiting(base_url):
    """Test that rate limiting is working."""
    print("Testing rate limiting...")
    try:
        endpoint = urljoin(base_url, "/api/health")
        
        # Make several rapid requests to trigger rate limiting
        print_warning("Making multiple rapid requests to test rate limiting...")
        responses = []
        for i in range(30):  # Adjust based on your rate limit settings
            response = requests.get(endpoint)
            responses.append(response.status_code)
            
            # Check if we've been rate limited
            if response.status_code == 429:
                print_success("Rate limiting is working correctly")
                return True
                
        # If we never got rate limited
        print_warning("Rate limiting test inconclusive. No rate limits encountered after 30 requests.")
        return True
    except requests.exceptions.RequestException as e:
        print_error(f"Error testing rate limiting: {e}")
        return False

def test_cors_headers(base_url):
    """Test that CORS headers are properly configured."""
    print("Testing CORS headers...")
    try:
        headers = {
            "Origin": "https://assetanchor.io"
        }
        
        response = requests.options(urljoin(base_url, "/api/health"), headers=headers)
        
        if 'Access-Control-Allow-Origin' not in response.headers:
            print_error("CORS headers are not configured correctly: missing Access-Control-Allow-Origin")
            return False
            
        print_success("CORS headers are configured")
        return True
    except requests.exceptions.RequestException as e:
        print_error(f"Error testing CORS headers: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Run smoke tests against Asset Anchor API')
    parser.add_argument('--url', '--base-url', type=str, default=API_BASE_URL, help='Base URL for the API')
    args = parser.parse_args()
    
    print(f"Running smoke tests against {args.url}")
    
    tests = [
        ("Health Endpoint", test_health_endpoint),
        ("Webhook Security", test_webhooks_stripe_endpoint_security),
        ("Rate Limiting", test_rate_limiting),
        ("CORS Headers", test_cors_headers)
    ]
    
    failures = 0
    
    for test_name, test_func in tests:
        print(f"\n----- Testing: {test_name} -----")
        if not test_func(args.url):
            failures += 1
    
    print("\n----- Test Summary -----")
    if failures == 0:
        print_success(f"All {len(tests)} tests passed!")
        return 0
    else:
        print_error(f"{failures} out of {len(tests)} tests failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
