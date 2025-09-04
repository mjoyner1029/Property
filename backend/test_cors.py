#!/usr/bin/env python3
"""
Test CORS headers on the API endpoints.
"""
import os
import sys
import json
import requests
from urllib.parse import urljoin

def get_base_url():
    """Get the base URL of the API server from environment or use default."""
    return os.environ.get("API_URL", "http://localhost:5050")

def test_cors_headers(origins=None):
    """
    Test that CORS headers are properly configured.
    
    This test performs OPTIONS preflight and GET requests with different Origin headers
    to verify that CORS is properly configured to only allow specified origins.
    """
    base_url = get_base_url()
    test_url = urljoin(base_url, "/api/health")
    
    if not origins:
        # Default test origins - one valid, one invalid
        origins = [
            "https://assetanchor.io",
            "https://invalid-origin.example.com"
        ]
    
    success = True
    results = {}
    
    for origin in origins:
        print(f"\nTesting CORS with Origin: {origin}")
        
        # Test OPTIONS (preflight) request
        try:
            headers = {
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Content-Type,Authorization"
            }
            response = requests.options(test_url, headers=headers, timeout=5)
            
            # Get all access-control headers from response
            cors_headers = {k: v for k, v in response.headers.items() 
                           if k.lower().startswith("access-control")}
            
            # Check if this origin should be allowed
            allowed_origin = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
            should_be_allowed = origin in allowed_origin or allowed_origin == "*"
            
            if should_be_allowed:
                # For allowed origins, we expect certain CORS headers
                if "access-control-allow-origin" in response.headers.keys():
                    allow_origin = response.headers.get("access-control-allow-origin")
                    if allow_origin == origin:
                        print(f"✓ Access-Control-Allow-Origin correctly set to: {allow_origin}")
                    else:
                        print(f"✗ Access-Control-Allow-Origin ({allow_origin}) doesn't match request origin ({origin})")
                        success = False
                else:
                    print(f"✗ Missing Access-Control-Allow-Origin header for allowed origin: {origin}")
                    success = False
                
                # Check for other required headers for preflight
                if "access-control-allow-methods" not in response.headers.keys():
                    print("✗ Missing Access-Control-Allow-Methods header")
                    success = False
                    
                if "access-control-allow-credentials" not in response.headers.keys():
                    print("✗ Missing Access-Control-Allow-Credentials header")
                    success = False
            else:
                # For disallowed origins, we expect no CORS headers
                if "access-control-allow-origin" in response.headers.keys():
                    print(f"✗ Unexpected Access-Control-Allow-Origin header for disallowed origin: {origin}")
                    success = False
                else:
                    print(f"✓ Correctly rejected disallowed origin: {origin}")
            
            # Store results
            results[origin] = {
                "status_code": response.status_code,
                "headers": cors_headers
            }
            
        except Exception as e:
            print(f"✗ Error testing OPTIONS with origin {origin}: {e}")
            success = False
    
    return success, results

if __name__ == "__main__":
    # Allow specifying custom origins for testing
    custom_origins = sys.argv[1:] if len(sys.argv) > 1 else None
    
    success, results = test_cors_headers(custom_origins)
    
    print("\n----- Test Results -----")
    for origin, data in results.items():
        print(f"\nOrigin: {origin}")
        print(f"Status Code: {data['status_code']}")
        print("CORS Headers:")
        for header, value in data["headers"].items():
            print(f"  {header}: {value}")
    
    print("\n----- Summary -----")
    if success:
        print("✅ CORS headers are configured correctly")
        sys.exit(0)
    else:
        print("❌ CORS headers are NOT configured correctly")
        sys.exit(1)
